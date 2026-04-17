<?php

namespace App\Http\Controllers;

use App\Http\Requests\ImportTicketsRequest;
use App\Http\Requests\StoreTicketRequest;
use App\Http\Requests\UpdateTicketRequest;
use App\Models\Inventaris;
use App\Models\Pegawai;
use App\Models\Project;
use App\Models\Ticket;
use App\Models\TicketActivity;
use App\Models\TicketCategory;
use App\Models\TicketPriority;
use App\Models\TicketSlaRule;
use App\Models\TicketStatus;
use App\Models\TicketTag;
use App\Models\TicketType;
use App\Models\User;
use App\Notifications\TicketAssignedNotification;
use App\Notifications\TicketCreatedNotification;
use App\Services\TicketAttachmentStorageService;
use App\Services\TicketTelegramGroupNotifier;
use App\Support\TicketResolutionDuration;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Response as ResponseFacade;
use Inertia\Inertia;
use Inertia\Response;

class TicketController extends Controller
{
    /**
     * Display a listing of tickets.
     */
    public function index(Request $request): Response
    {
        $user = $request->user();

        $query = Ticket::query()
            ->with([
                'type',
                'category',
                'subcategory',
                'priority',
                'status',
                'requester',
                'assignee',
                'group',
                'project',
                'tags',
                'inventaris.barang',
                'inventaris.ruang',
                'openIssues' => fn ($q) => $q->select(['id', 'ticket_id', 'title', 'status', 'created_at']),
            ]);

        $this->applyTicketListRequestFilters($query, $request, $user);

        $tickets = $query
            ->orderBy('created_at', 'desc')
            ->paginate(15)
            ->withQueryString();

        $tickets = $tickets->through(function (Ticket $ticket) {
            $ticket->setAttribute(
                'resolution_duration_label',
                TicketResolutionDuration::format($ticket->created_at, $ticket->closed_at)
            );

            return $ticket;
        });

        // Enrich requester dengan nama departemen dari pegawai SIMRS (untuk tampilan & export/import)
        $this->addRequesterDepartemenToTickets($tickets->getCollection());

        return Inertia::render('tickets/index', [
            'tickets' => $tickets,
            'statuses' => TicketStatus::active()->ordered()->get(),
            'priorities' => TicketPriority::active()->ordered()->get(),
            'tags' => TicketTag::where('is_active', true)->orderBy('name')->get(['id', 'name', 'slug']),
            'filters' => $request->only(['status', 'priority', 'department', 'assignee', 'search', 'tag', 'category', 'subcategory', 'project', 'created_from', 'created_to', 'closed_from', 'closed_to', 'resolved_only', 'include_closed', 'draft']),
            'categories' => $this->getCategoriesForTicketList($user),
            'projects' => Project::query()->orderBy('name')->get(['id', 'name']),
            'canExport' => $user->isAdmin() || $user->isStaff(),
            'canDelete' => $user->isAdmin(),
        ]);
    }

    /**
     * Kategori (dengan subkategori) untuk filter daftar tiket. Staff hanya lihat kategori departemennya.
     */
    private function getCategoriesForTicketList(\App\Models\User $user): \Illuminate\Support\Collection
    {
        $query = TicketCategory::active()->with('subcategories')->orderBy('name');
        if ($user->isStaff() && $user->dep_id) {
            $query->where('dep_id', $user->dep_id);
        }

        return $query->get(['id', 'name', 'dep_id', 'ticket_type_id', 'is_development']);
    }

    /**
     * Filter query daftar tiket (index & export CSV) agar selaras dengan filter UI.
     *
     * @param  \Illuminate\Database\Eloquent\Builder<Ticket>  $query
     */
    private function applyTicketListRequestFilters(\Illuminate\Database\Eloquent\Builder $query, Request $request, User $user): void
    {
        $isDraftMode = $request->boolean('draft');

        if ($isDraftMode) {
            $query->draft();

            if ($user->isAdmin()) {
                // semua draf
            } elseif ($user->isStaff()) {
                // Sama seperti tiket terbit: anggota tim satu departemen (dan terkait) ikut melihat draf
                $groupIds = \App\Models\TicketGroup::whereHas('members', fn ($q) => $q->where('user_id', $user->id))->pluck('id');
                $query->where(function ($q) use ($user, $groupIds) {
                    $q->where('dep_id', $user->dep_id)
                        ->orWhere('assignee_id', $user->id)
                        ->orWhere('requester_id', $user->id)
                        ->orWhereHas('collaborators', fn ($q) => $q->where('user_id', $user->id))
                        ->orWhereIn('ticket_group_id', $groupIds);
                });
            } else {
                $query->where('requester_id', $user->id);
            }
        } else {
            $query->published();

            if ($user->isPemohon()) {
                $query->where('requester_id', $user->id);
            } elseif ($user->isStaff()) {
                $groupIds = \App\Models\TicketGroup::whereHas('members', fn ($q) => $q->where('user_id', $user->id))->pluck('id');
                $query->where(function ($q) use ($user, $groupIds) {
                    $q->where('dep_id', $user->dep_id)
                        ->orWhere('assignee_id', $user->id)
                        ->orWhere('requester_id', $user->id)
                        ->orWhereHas('collaborators', fn ($q) => $q->where('user_id', $user->id))
                        ->orWhereIn('ticket_group_id', $groupIds);
                });
            }
        }

        if (! $isDraftMode && ! $request->boolean('include_closed')) {
            $query->whereHas('status', fn ($q) => $q->where('is_closed', false));
        }

        if ($request->filled('status')) {
            $query->where('ticket_status_id', $request->status);
        }

        if ($request->filled('priority')) {
            $query->where('ticket_priority_id', $request->priority);
        }

        if ($request->filled('department') && $user->isAdmin()) {
            $query->where('dep_id', $request->department);
        }

        if ($request->filled('assignee')) {
            if ($request->assignee === 'unassigned') {
                $query->whereNull('assignee_id');
            } elseif ($request->assignee === 'me') {
                $query->where('assignee_id', $user->id);
            } elseif ($request->assignee === 'my_group') {
                $groupIds = \App\Models\TicketGroup::whereHas('members', fn ($q) => $q->where('user_id', $user->id))->pluck('id');
                $query->whereIn('ticket_group_id', $groupIds)->whereNull('assignee_id');
            } else {
                $query->where('assignee_id', $request->assignee);
            }
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('ticket_number', 'like', "%{$search}%")
                    ->orWhere('title', 'like', "%{$search}%");
            });
        }

        if ($request->filled('tag')) {
            $query->whereHas('tags', fn ($q) => $q->where('ticket_tags.id', $request->tag));
        }

        if ($request->filled('category')) {
            $query->where('ticket_category_id', $request->category);
        }

        if ($request->filled('subcategory')) {
            $query->where('ticket_subcategory_id', $request->subcategory);
        }

        if ($request->filled('project')) {
            $projectVal = $request->project;
            if ($projectVal === '0' || $projectVal === '__none__') {
                $query->whereNull('project_id');
            } else {
                $query->where('project_id', (int) $projectVal);
            }
        }

        if ($request->filled('created_from') && $request->filled('created_to')) {
            $query->whereBetween('created_at', [
                $request->date('created_from')->startOfDay(),
                $request->date('created_to')->endOfDay(),
            ]);
        } else {
            if ($request->filled('from')) {
                $query->whereDate('created_at', '>=', $request->from);
            }
            if ($request->filled('to')) {
                $query->whereDate('created_at', '<=', $request->to);
            }
        }

        if ($request->filled('closed_from') && $request->filled('closed_to')) {
            $query->whereNotNull('closed_at')
                ->whereBetween('closed_at', [
                    $request->date('closed_from')->startOfDay(),
                    $request->date('closed_to')->endOfDay(),
                ]);
        }

        if ($request->boolean('resolved_only')) {
            $query->whereNotNull('resolved_at');
        }
    }

    /**
     * Judul masalah terbuka digabung untuk sel CSV (boleh beberapa, dipisah " | ").
     */
    private function formatOpenIssuesForCsvExport(Ticket $ticket): string
    {
        if (! $ticket->relationLoaded('openIssues') || $ticket->openIssues->isEmpty()) {
            return '';
        }

        return $ticket->openIssues->pluck('title')->filter()->implode(' | ');
    }

    /**
     * Enrich tiap tiket dengan requester.departemen dari tabel pegawai SIMRS (pegawai.departemen).
     * Sama seperti di Laporan Pemohon per Unit, agar nama unit/departemen pelapor tampil dan bisa dipakai untuk export/import.
     *
     * @param  \Illuminate\Support\Collection<int, Ticket>  $tickets
     */
    private function addRequesterDepartemenToTickets(\Illuminate\Support\Collection $tickets): void
    {
        $niks = $tickets->pluck('requester.simrs_nik')->filter()->unique()->values()->all();
        if (empty($niks)) {
            return;
        }
        try {
            $departemenByNik = Pegawai::query()
                ->whereIn('nik', $niks)
                ->get(['nik', 'departemen'])
                ->keyBy('nik')
                ->map(fn ($p) => $p->departemen ?? null)
                ->all();
        } catch (\Throwable) {
            $departemenByNik = [];
        }
        $tickets->each(function (Ticket $ticket) use ($departemenByNik) {
            if ($ticket->relationLoaded('requester') && $ticket->requester && $ticket->requester->simrs_nik !== null) {
                $ticket->requester->departemen = $departemenByNik[$ticket->requester->simrs_nik] ?? null;
            }
        });
    }

    /**
     * Papan Kanban: daftar tiket per status (view saja, data dari Ticket).
     * Tiket open (is_closed=false) + tiket Ditutup (is_closed=true) ditampilkan agar kolom Ditutup terisi.
     */
    public function board(Request $request): Response
    {
        $user = $request->user();

        $query = Ticket::query()
            ->with(['type', 'category', 'priority', 'status', 'requester', 'assignee', 'tags'])
            ->published()
            ->whereHas('status', fn ($q) => $q->where('is_active', true));

        if ($user->isPemohon()) {
            $query->where('requester_id', $user->id);
        } elseif ($user->isStaff()) {
            $groupIds = \App\Models\TicketGroup::whereHas('members', fn ($q) => $q->where('user_id', $user->id))->pluck('id');
            $query->where(function ($q) use ($user, $groupIds) {
                $q->where('dep_id', $user->dep_id)
                    ->orWhere('assignee_id', $user->id)
                    ->orWhere('requester_id', $user->id)
                    ->orWhereHas('collaborators', fn ($q) => $q->where('user_id', $user->id))
                    ->orWhereIn('ticket_group_id', $groupIds);
            });
        }

        $tickets = $query->orderBy('updated_at', 'desc')->limit(150)->get();
        $statuses = TicketStatus::active()->ordered()->get();

        return Inertia::render('tickets/board', [
            'tickets' => $tickets,
            'statuses' => $statuses,
            'canChangeStatus' => $user->isAdmin() || $user->isStaff(),
        ]);
    }

    /**
     * Show the form for creating a new ticket.
     */
    public function create(Request $request): Response
    {
        $user = $request->user();

        // Get categories berdasarkan role
        $categoriesQuery = TicketCategory::active()->with('subcategories');

        // Staff IT hanya lihat kategori IT, Staff IPS hanya lihat kategori IPS
        if ($user->isStaff() && $user->dep_id) {
            $categoriesQuery->where('dep_id', $user->dep_id);
        }

        $recentTicketsForLink = $this->getTicketsForRelatedSelect($user)
            ->orderBy('created_at', 'desc')
            ->limit(50)
            ->get(['id', 'ticket_number', 'title', 'created_at']);

        $projects = Project::query()->orderBy('name')->get(['id', 'name']);
        $initialProjectId = $request->integer('project_id', 0) ?: null;

        return Inertia::render('tickets/create', [
            'types' => TicketType::active()->get(),
            'categories' => $categoriesQuery->get(),
            'priorities' => TicketPriority::active()->ordered()->get(),
            'tags' => TicketTag::where('is_active', true)->orderBy('name')->get(['id', 'name', 'slug']),
            'recentTicketsForLink' => $recentTicketsForLink,
            'canSelectRequester' => $user->isAdmin() || $user->isStaff(),
            'projects' => $projects,
            'initialProjectId' => $initialProjectId,
        ]);
    }

    /**
     * Search tickets for related ticket selector.
     */
    public function searchForLink(Request $request): \Illuminate\Http\JsonResponse
    {
        $user = $request->user();
        $q = $request->query('q', '');

        $tickets = $this->getTicketsForRelatedSelect($user)
            ->when($q, function ($query) use ($q) {
                $query->where(function ($q2) use ($q) {
                    $q2->where('ticket_number', 'like', "%{$q}%")
                        ->orWhere('title', 'like', "%{$q}%");
                });
            })
            ->orderBy('created_at', 'desc')
            ->limit(20)
            ->get(['id', 'ticket_number', 'title', 'created_at']);

        return response()->json($tickets);
    }

    /**
     * Search inventaris for asset selector (IPS: alat medis, peralatan).
     */
    public function searchForInventaris(Request $request): \Illuminate\Http\JsonResponse
    {
        $q = $request->query('q', '');

        try {
            $query = Inventaris::query()
                ->with(['barang', 'ruang'])
                ->when($q, function ($query) use ($q) {
                    $query->where(function ($q2) use ($q) {
                        $q2->where('no_inventaris', 'like', "%{$q}%")
                            ->orWhere('kode_barang', 'like', "%{$q}%");
                    });
                })
                ->orderBy('no_inventaris')
                ->limit(20);

            $items = $query->get()->map(function (Inventaris $inv) {
                return [
                    'no_inventaris' => $inv->no_inventaris,
                    'kode_barang' => $inv->kode_barang,
                    'nama_barang' => $inv->barang?->nama_barang ?? $inv->kode_barang,
                    'nama_ruang' => $inv->ruang?->nama_ruang ?? null,
                    'status_barang' => $inv->status_barang ?? null,
                ];
            });

            return response()->json($items);
        } catch (\Throwable $e) {
            return response()->json([]);
        }
    }

    /**
     * Search users for requester selector (admin dan staff/teknisi).
     */
    public function searchForUser(Request $request): \Illuminate\Http\JsonResponse
    {
        $user = $request->user();
        if (! $user?->isAdmin() && ! $user?->isStaff()) {
            return response()->json([], 403);
        }

        $q = $request->query('q', '');

        try {
            $users = User::query()
                ->when($q, function ($query) use ($q) {
                    $query->where(function ($q2) use ($q) {
                        $q2->where('name', 'like', "%{$q}%")
                            ->orWhere('email', 'like', "%{$q}%")
                            ->orWhere('simrs_nik', 'like', "%{$q}%");
                    });
                })
                ->orderBy('name')
                ->limit(20)
                ->get(['id', 'name', 'email', 'simrs_nik', 'role', 'dep_id'])
                ->map(function (User $user) {
                    return [
                        'id' => $user->id,
                        'name' => $user->name,
                        'email' => $user->email,
                        'simrs_nik' => $user->simrs_nik,
                        'role' => $user->role,
                        'dep_id' => $user->dep_id,
                    ];
                });

            return response()->json($users);
        } catch (\Throwable $e) {
            return response()->json([]);
        }
    }

    private function getTicketsForRelatedSelect(User $user): \Illuminate\Database\Eloquent\Builder
    {
        $query = Ticket::query()->published();

        if ($user->isPemohon()) {
            $query->where('requester_id', $user->id);
        } elseif ($user->isStaff()) {
            $query->where(function ($q) use ($user) {
                $q->where('requester_id', $user->id)
                    ->orWhere('dep_id', $user->dep_id);
            });
        }
        // Admin sees all

        return $query;
    }

    /**
     * Store a newly created ticket.
     */
    public function store(StoreTicketRequest $request): RedirectResponse
    {
        $this->authorize('create', Ticket::class);

        $user = $request->user();
        $validated = $request->validated();

        // Get category untuk menentukan dep_id
        $category = isset($validated['ticket_category_id'])
            ? TicketCategory::find($validated['ticket_category_id'])
            : null;

        // Get status "Baru"
        $newStatus = TicketStatus::where('slug', TicketStatus::SLUG_NEW)->first();

        // Calculate SLA due dates
        $isDraft = (bool) ($validated['is_draft'] ?? false);

        $slaDates = $isDraft
            ? ['response_due_at' => null, 'resolution_due_at' => null]
            : $this->calculateSlaDates(
                $validated['ticket_type_id'],
                $validated['ticket_priority_id'],
                $validated['ticket_category_id'] ?? null
            );

        // Determine department: from category if set, otherwise default to IT
        $depId = $category?->dep_id ?? 'IT';

        // Tentukan requester: admin dan staff bisa pilih manual, pemohon = diri sendiri
        $requesterId = $user->id;
        if (($user->isAdmin() || $user->isStaff()) && ! empty($validated['requester_id'])) {
            $requesterId = $validated['requester_id'];
        }

        $ticket = Ticket::create([
            'ticket_type_id' => $validated['ticket_type_id'],
            'ticket_category_id' => $validated['ticket_category_id'] ?? null,
            'ticket_subcategory_id' => $validated['ticket_subcategory_id'] ?? null,
            'ticket_priority_id' => $validated['ticket_priority_id'],
            'ticket_status_id' => $newStatus->id,
            'dep_id' => $depId,
            'requester_id' => $requesterId,
            'title' => $validated['title'],
            'description' => $validated['description'] ?? null,
            'related_ticket_id' => $validated['related_ticket_id'] ?? null,
            'asset_no_inventaris' => $validated['asset_no_inventaris'] ?? null,
            'project_id' => $validated['project_id'] ?? null,
            'is_draft' => $isDraft,
            'published_at' => $isDraft ? null : now(),
            'plan_ideas' => $validated['plan_ideas'] ?? null,
            'plan_tools' => $validated['plan_tools'] ?? null,
            'budget_estimate' => $validated['budget_estimate'] ?? null,
            'budget_notes' => $validated['budget_notes'] ?? null,
            'response_due_at' => $slaDates['response_due_at'],
            'resolution_due_at' => $slaDates['resolution_due_at'],
        ]);

        if (! empty($validated['tag_ids'])) {
            $ticket->tags()->sync($validated['tag_ids']);
        }

        if (! empty($validated['created_at'])) {
            $backdate = Carbon::parse($validated['created_at']);
            DB::table('tickets')
                ->where('id', $ticket->id)
                ->update(['created_at' => $backdate->format('Y-m-d H:i:s')]);
            $ticket->refresh();
        }

        $this->normalizeDraftPlanFields($ticket);

        $this->storeAttachmentsFromCreateRequest($request, $ticket);

        // Log activity
        $ticket->logActivity(
            TicketActivity::ACTION_CREATED,
            null,
            null,
            $isDraft ? 'Draf tiket dibuat' : 'Tiket dibuat'
        );

        $notificationKind = $isDraft ? 'draft' : 'new';

        $staffInDept = User::where('role', 'staff')->where('dep_id', $depId)->get();
        foreach ($staffInDept as $staff) {
            $staff->notify(new TicketCreatedNotification($ticket, $notificationKind));
        }

        TicketTelegramGroupNotifier::notifyNewTicket($ticket, $notificationKind);

        return redirect()
            ->route('tickets.show', $ticket)
            ->with('success', $isDraft
                ? "Draf #{$ticket->ticket_number} berhasil disimpan."
                : "Tiket #{$ticket->ticket_number} berhasil dibuat.");
    }

    /**
     * Display the specified ticket.
     */
    public function show(Ticket $ticket): Response
    {
        $this->authorize('view', $ticket);

        $user = request()->user();

        $ticket->load([
            'type',
            'category',
            'subcategory',
            'priority',
            'status',
            'requester',
            'assignee',
            'group',
            'project',
            'relatedTicket',
            'tags',
            'inventaris.barang',
            'inventaris.ruang',
            'collaborators.user',
            'comments' => fn ($q) => $q->visibleTo($user)->with('user')->orderBy('created_at', 'asc'),
            'attachments.user',
            'issues.creator',
            'activities' => fn ($q) => $q->with('user')->orderBy('created_at', 'desc')->limit(20),
            'vendorCosts',
            'sparepartItems',
        ]);

        // Get available assignees (staff dari departemen yang sama)
        $availableAssignees = [];
        if ($user->isAdmin() || $user->isStaff()) {
            $availableAssignees = User::query()
                ->where('role', 'staff')
                ->where(function ($q) use ($ticket, $user) {
                    if ($user->isAdmin()) {
                        $q->where('dep_id', $ticket->dep_id);
                    } else {
                        $q->where('dep_id', $user->dep_id);
                    }
                })
                ->orderBy('name')
                ->get(['id', 'name', 'dep_id']);
        }

        // Get staff yang bisa jadi rekan (semua dept, kecuali yang sudah assignee/rekan)
        $availableCollaborators = [];
        if ($user->can('manageCollaborators', $ticket)) {
            $existingCollaboratorIds = $ticket->collaborators->pluck('user_id')->push($ticket->assignee_id)->filter()->toArray();
            $availableCollaborators = User::query()
                ->where('role', 'staff')
                ->whereNotIn('id', $existingCollaboratorIds)
                ->orderBy('dep_id')
                ->orderBy('name')
                ->get(['id', 'name', 'dep_id']);
        }

        // Get available groups for assign (untuk tiket gabungan - assign ke grup)
        $availableGroups = [];
        if ($user->isAdmin() || $user->isStaff()) {
            $availableGroups = \App\Models\TicketGroup::active()
                ->where('dep_id', $ticket->dep_id)
                ->orderBy('name')
                ->get(['id', 'name', 'dep_id']);
        }

        $isWaitingConfirmation = $ticket->status->slug === TicketStatus::SLUG_WAITING_CONFIRMATION;

        return Inertia::render('tickets/show', [
            'ticket' => $ticket,
            'statuses' => TicketStatus::active()->ordered()->get(),
            'priorities' => TicketPriority::active()->ordered()->get(),
            'availableAssignees' => $availableAssignees,
            'availableCollaborators' => $availableCollaborators,
            'availableGroups' => $availableGroups,
            'canEdit' => $user->can('update', $ticket),
            'canAssign' => $user->can('assign', $ticket),
            'canChangeStatus' => $user->can('changeStatus', $ticket),
            'canSetDueDate' => $user->can('setDueDate', $ticket),
            'canConfirm' => $isWaitingConfirmation && $user->can('confirmClosure', $ticket),
            'canAttach' => $user->can('attach', $ticket),
            'canManageCollaborators' => $user->can('manageCollaborators', $ticket),
            'canManageVendorCosts' => $user->can('manageVendorCosts', $ticket),
            'canResolveIssue' => $user->can('changeStatus', $ticket),
            'canPublish' => $user->can('publish', $ticket),
        ]);
    }

    /**
     * Show the form for editing the specified ticket.
     */
    public function edit(Ticket $ticket): Response
    {
        $this->authorize('update', $ticket);

        $user = request()->user();

        $ticket->load(['type', 'category', 'subcategory', 'priority', 'status', 'requester', 'tags', 'inventaris.barang', 'inventaris.ruang', 'project:id,name']);

        return Inertia::render('tickets/edit', [
            'ticket' => $ticket,
            'types' => TicketType::active()->get(),
            'categories' => TicketCategory::active()->with('subcategories')->get(),
            'priorities' => TicketPriority::active()->ordered()->get(),
            'statuses' => TicketStatus::active()->ordered()->get(),
            'tags' => TicketTag::where('is_active', true)->orderBy('name')->get(['id', 'name', 'slug']),
            'canSelectRequester' => $user->isAdmin() || $user->isStaff(),
            'canDelete' => $user->can('delete', $ticket),
            'projects' => Project::query()->orderBy('name')->get(['id', 'name']),
        ]);
    }

    /**
     * Update the specified ticket.
     */
    public function update(UpdateTicketRequest $request, Ticket $ticket): RedirectResponse
    {
        $this->authorize('update', $ticket);

        $user = $request->user();
        $validated = $request->validated();

        // Track changes for activity log
        $changes = [];

        /** @var array{type: 'assigned', assignee: User, by: User}|array{type: 'unassigned', previous: string, by: User}|null */
        $telegramAssigneeGroupEvent = null;

        // Update status
        if (isset($validated['ticket_status_id']) && $ticket->ticket_status_id !== $validated['ticket_status_id']) {
            $oldStatus = $ticket->status->name;
            $newStatus = TicketStatus::find($validated['ticket_status_id']);

            // Selesai -> otomatis ke Menunggu Konfirmasi (pemohon verifikasi)
            if ($newStatus->slug === TicketStatus::SLUG_RESOLVED) {
                $waitingStatus = TicketStatus::where('slug', TicketStatus::SLUG_WAITING_CONFIRMATION)->first();
                if ($waitingStatus) {
                    $newStatus = $waitingStatus;
                }
            }

            $ticket->ticket_status_id = $newStatus->id;

            // Set timestamps based on status
            if ($newStatus->slug === TicketStatus::SLUG_WAITING_CONFIRMATION) {
                $ticket->resolved_at = now();
            } elseif ($newStatus->slug === TicketStatus::SLUG_CLOSED) {
                $ticket->closed_at = now();
            }

            $changes[] = ['action' => TicketActivity::ACTION_STATUS_CHANGED, 'old' => $oldStatus, 'new' => $newStatus->name];
        }

        // Update assignee
        if (array_key_exists('assignee_id', $validated)) {
            $oldAssignee = $ticket->assignee?->name ?? 'Belum ditugaskan';
            $newAssigneeId = $validated['assignee_id'];

            if ($ticket->assignee_id !== $newAssigneeId) {
                $ticket->assignee_id = $newAssigneeId;

                if ($newAssigneeId) {
                    $newAssignee = User::find($newAssigneeId);
                    if ($newAssignee === null) {
                        $ticket->assignee_id = $ticket->getOriginal('assignee_id');
                    } else {
                        $changes[] = ['action' => TicketActivity::ACTION_ASSIGNED, 'old' => $oldAssignee, 'new' => $newAssignee->name];

                        $telegramAssigneeGroupEvent = [
                            'type' => 'assigned',
                            'assignee' => $newAssignee,
                            'by' => $user,
                        ];

                        $newAssignee->notify(new TicketAssignedNotification($ticket, $user));

                        // Set first response time if not set
                        if (! $ticket->first_response_at) {
                            $ticket->first_response_at = now();
                        }

                        // Update status to "Ditugaskan" if still "Baru"
                        $currentStatus = $ticket->status;
                        if ($currentStatus->slug === TicketStatus::SLUG_NEW) {
                            $assignedStatus = TicketStatus::where('slug', TicketStatus::SLUG_ASSIGNED)->first();
                            if ($assignedStatus) {
                                $ticket->ticket_status_id = $assignedStatus->id;
                                $changes[] = ['action' => TicketActivity::ACTION_STATUS_CHANGED, 'old' => $currentStatus->name, 'new' => $assignedStatus->name];
                            }
                        }
                    }
                } else {
                    $changes[] = ['action' => TicketActivity::ACTION_UNASSIGNED, 'old' => $oldAssignee, 'new' => null];
                    $telegramAssigneeGroupEvent = [
                        'type' => 'unassigned',
                        'previous' => $oldAssignee,
                        'by' => $user,
                    ];
                }
            }
        }

        // Update ticket group (assign to group pool)
        if (array_key_exists('ticket_group_id', $validated)) {
            $ticket->ticket_group_id = $validated['ticket_group_id'] ?: null;
        }

        // Update priority
        if (isset($validated['ticket_priority_id']) && $ticket->ticket_priority_id !== $validated['ticket_priority_id']) {
            $oldPriority = $ticket->priority->name;
            $newPriority = TicketPriority::find($validated['ticket_priority_id']);
            $ticket->ticket_priority_id = $validated['ticket_priority_id'];
            $changes[] = ['action' => TicketActivity::ACTION_PRIORITY_CHANGED, 'old' => $oldPriority, 'new' => $newPriority->name];
        }

        // Update requester (admin/staff only)
        if (array_key_exists('requester_id', $validated) && ($user->isAdmin() || $user->isStaff())) {
            $newRequesterId = $validated['requester_id'];
            if ($newRequesterId !== null && $ticket->requester_id !== $newRequesterId) {
                $oldRequester = $ticket->requester?->name ?? '—';
                $newRequester = User::find($newRequesterId);

                if ($newRequester !== null) {
                    $ticket->requester_id = $newRequester->id;
                    $changes[] = ['action' => TicketActivity::ACTION_REQUESTER_CHANGED, 'old' => $oldRequester, 'new' => $newRequester->name];
                }
            }
        }

        // Update due date (only for development tickets by authorized users)
        if (isset($validated['due_date']) && $user->can('setDueDate', $ticket)) {
            $ticket->due_date = $validated['due_date'];
        }

        // Update inventaris / asset
        if (array_key_exists('asset_no_inventaris', $validated)) {
            $ticket->asset_no_inventaris = $validated['asset_no_inventaris'] ?: null;
        }

        // Update tags
        if (array_key_exists('tag_ids', $validated)) {
            $ticket->tags()->sync($validated['tag_ids'] ?? []);
        }

        // Update basic fields
        if (isset($validated['title'])) {
            $ticket->title = $validated['title'];
        }
        if (isset($validated['description'])) {
            $ticket->description = $validated['description'];
        }
        if (array_key_exists('plan_ideas', $validated)) {
            $ticket->plan_ideas = $validated['plan_ideas'];
        }
        if (array_key_exists('plan_tools', $validated)) {
            $ticket->plan_tools = $validated['plan_tools'];
        }
        if (array_key_exists('budget_estimate', $validated)) {
            $ticket->budget_estimate = $validated['budget_estimate'];
        }
        if (array_key_exists('budget_notes', $validated)) {
            $ticket->budget_notes = $validated['budget_notes'];
        }
        if (array_key_exists('project_id', $validated)) {
            $ticket->project_id = $validated['project_id'] ?: null;
        }

        $ticket->save();
        $this->normalizeDraftPlanFields($ticket);

        // Log all changes
        foreach ($changes as $change) {
            $ticket->logActivity($change['action'], $change['old'], $change['new']);
        }

        if ($telegramAssigneeGroupEvent !== null) {
            $ticket->refresh();
            if ($telegramAssigneeGroupEvent['type'] === 'assigned') {
                TicketTelegramGroupNotifier::notifyTicketAssigned(
                    $ticket,
                    $telegramAssigneeGroupEvent['assignee'],
                    $telegramAssigneeGroupEvent['by']
                );
            } elseif ($telegramAssigneeGroupEvent['type'] === 'unassigned') {
                TicketTelegramGroupNotifier::notifyTicketUnassigned(
                    $ticket,
                    $telegramAssigneeGroupEvent['previous'],
                    $telegramAssigneeGroupEvent['by']
                );
            }
        }

        return redirect()
            ->route('tickets.show', $ticket)
            ->with('success', 'Tiket berhasil diperbarui.');
    }

    /**
     * Publish draft ticket as active ticket with SLA and notifications.
     */
    public function publish(Ticket $ticket): RedirectResponse
    {
        $this->authorize('publish', $ticket);

        if (! $ticket->is_draft) {
            return redirect()
                ->route('tickets.show', $ticket)
                ->with('info', 'Tiket ini sudah dipublikasikan.');
        }

        $slaDates = $this->calculateSlaDates(
            $ticket->ticket_type_id,
            $ticket->ticket_priority_id,
            $ticket->ticket_category_id
        );

        $ticket->is_draft = false;
        $ticket->published_at = now();
        $ticket->response_due_at = $slaDates['response_due_at'];
        $ticket->resolution_due_at = $slaDates['resolution_due_at'];
        $ticket->save();
        $this->normalizeDraftPlanFields($ticket);

        $ticket->logActivity(TicketActivity::ACTION_CREATED, null, null, 'Draf dipublikasikan menjadi tiket aktif');

        $staffInDept = User::where('role', 'staff')->where('dep_id', $ticket->dep_id)->get();
        foreach ($staffInDept as $staff) {
            $staff->notify(new TicketCreatedNotification($ticket, 'published'));
        }

        TicketTelegramGroupNotifier::notifyNewTicket($ticket, 'published');

        return redirect()
            ->route('tickets.show', $ticket)
            ->with('success', "Draf #{$ticket->ticket_number} berhasil dipublikasikan.");
    }

    /**
     * Assign ticket to self (for staff).
     */
    public function assignToSelf(Ticket $ticket): RedirectResponse
    {
        $this->authorize('assign', $ticket);

        $user = request()->user();

        $oldAssignee = $ticket->assignee?->name ?? 'Belum ditugaskan';
        $ticket->assignee_id = $user->id;

        // Set first response time
        if (! $ticket->first_response_at) {
            $ticket->first_response_at = now();
        }

        // Update status jika masih "Baru"
        if ($ticket->status->slug === TicketStatus::SLUG_NEW) {
            $assignedStatus = TicketStatus::where('slug', TicketStatus::SLUG_ASSIGNED)->first();
            if ($assignedStatus) {
                $oldStatus = $ticket->status->name;
                $ticket->ticket_status_id = $assignedStatus->id;
                $ticket->logActivity(TicketActivity::ACTION_STATUS_CHANGED, $oldStatus, $assignedStatus->name);
            }
        }

        $ticket->save();

        $ticket->logActivity(TicketActivity::ACTION_ASSIGNED, $oldAssignee, $user->name, 'Mengambil tiket sendiri');

        $ticket->refresh();
        TicketTelegramGroupNotifier::notifyTicketTakenBySelf($ticket, $user);

        return redirect()
            ->route('tickets.show', $ticket)
            ->with('success', 'Tiket berhasil diambil.');
    }

    /**
     * Tandai tiket selesai (manual): isi resolved_at dan pindah ke Menunggu Konfirmasi.
     */
    public function resolve(Ticket $ticket): RedirectResponse
    {
        $this->authorize('changeStatus', $ticket);

        if ($ticket->status->is_closed) {
            return redirect()
                ->route('tickets.show', $ticket)
                ->with('info', 'Tiket sudah ditutup.');
        }

        $waitingStatus = TicketStatus::where('slug', TicketStatus::SLUG_WAITING_CONFIRMATION)->first();
        if (! $waitingStatus) {
            return redirect()
                ->route('tickets.show', $ticket)
                ->with('error', 'Status Menunggu Konfirmasi tidak ditemukan.');
        }

        $oldStatus = $ticket->status->name;
        $ticket->resolved_at = $ticket->resolved_at ?? now();
        $ticket->ticket_status_id = $waitingStatus->id;
        $ticket->save();

        $ticket->logActivity(TicketActivity::ACTION_STATUS_CHANGED, $oldStatus, $waitingStatus->name, 'Tandai selesai (manual)');

        return redirect()
            ->route('tickets.show', $ticket)
            ->with('success', 'Tiket ditandai selesai. Menunggu konfirmasi pemohon atau bisa ditutup oleh admin/staff.');
    }

    /**
     * Close ticket (quick action).
     * Jika resolved_at belum terisi (tiket ditutup langsung tanpa lewat Selesai),
     * di-set juga agar laporan/KPI konsisten: tiket ditutup = dianggap selesai.
     */
    public function close(Ticket $ticket): RedirectResponse
    {
        $this->authorize('changeStatus', $ticket);

        $oldStatus = $ticket->status->name;
        $closedStatus = TicketStatus::where('slug', TicketStatus::SLUG_CLOSED)->first();

        $ticket->ticket_status_id = $closedStatus->id;
        $ticket->closed_at = now();
        if ($ticket->resolved_at === null) {
            $ticket->resolved_at = now();
        }
        $ticket->save();

        $ticket->logActivity(TicketActivity::ACTION_CLOSED, $oldStatus, $closedStatus->name);

        return redirect()
            ->route('tickets.show', $ticket)
            ->with('success', 'Tiket berhasil ditutup.');
    }

    /**
     * Confirm ticket closure (pemohon).
     */
    public function confirm(Ticket $ticket): RedirectResponse
    {
        $this->authorize('confirmClosure', $ticket);

        $waitingStatus = TicketStatus::where('slug', TicketStatus::SLUG_WAITING_CONFIRMATION)->first();
        if ($ticket->ticket_status_id !== $waitingStatus?->id) {
            abort(400, 'Tiket tidak dalam status Menunggu Konfirmasi.');
        }

        $closedStatus = TicketStatus::where('slug', TicketStatus::SLUG_CLOSED)->first();
        $oldStatus = $ticket->status->name;

        $ticket->ticket_status_id = $closedStatus->id;
        $ticket->closed_at = now();
        $ticket->save();

        $ticket->logActivity(TicketActivity::ACTION_CLOSED, $oldStatus, $closedStatus->name, 'Dikonfirmasi oleh pemohon');

        return redirect()
            ->route('tickets.show', $ticket)
            ->with('success', 'Tiket berhasil dikonfirmasi dan ditutup.');
    }

    /**
     * Complain - return ticket to Dikerjakan (pemohon).
     */
    public function complain(Request $request, Ticket $ticket): RedirectResponse
    {
        $this->authorize('confirmClosure', $ticket);

        $request->validate([
            'note' => ['required', 'string', 'max:2000'],
        ]);

        $waitingStatus = TicketStatus::where('slug', TicketStatus::SLUG_WAITING_CONFIRMATION)->first();
        if ($ticket->ticket_status_id !== $waitingStatus?->id) {
            abort(400, 'Tiket tidak dalam status Menunggu Konfirmasi.');
        }

        $inProgressStatus = TicketStatus::where('slug', TicketStatus::SLUG_IN_PROGRESS)->first();
        $oldStatus = $ticket->status->name;

        $ticket->ticket_status_id = $inProgressStatus->id;
        $ticket->resolved_at = null;
        $ticket->save();

        $ticket->comments()->create([
            'user_id' => $request->user()->id,
            'body' => '[Komplain pemohon] '.$request->note,
            'is_internal' => false,
        ]);

        $ticket->logActivity(TicketActivity::ACTION_STATUS_CHANGED, $oldStatus, $inProgressStatus->name, 'Komplain dari pemohon');

        return redirect()
            ->route('tickets.show', $ticket)
            ->with('success', 'Komplain telah dicatat. Tiket kembali ke status Dikerjakan.');
    }

    /**
     * Export tickets to CSV.
     */
    public function export(Request $request): \Symfony\Component\HttpFoundation\StreamedResponse
    {
        $user = $request->user();

        if (! $user->isAdmin() && ! $user->isStaff()) {
            abort(403, 'Anda tidak memiliki akses untuk mengekspor tiket.');
        }

        $query = Ticket::query()
            ->with([
                'type',
                'category',
                'subcategory',
                'priority',
                'status',
                'requester',
                'assignee',
                'project',
                'tags',
                'openIssues' => fn ($q) => $q->select(['id', 'ticket_id', 'title', 'status', 'created_at']),
            ]);

        $this->applyTicketListRequestFilters($query, $request, $user);

        $filename = 'tickets-'.now()->format('Y-m-d-His').'.csv';

        return ResponseFacade::streamDownload(function () use ($query) {
            $handle = fopen('php://output', 'w');
            fwrite($handle, "\xEF\xBB\xBF");
            fputcsv($handle, [
                'No. Tiket',
                'Judul',
                'Tipe',
                'Kategori',
                'Subkategori',
                'Prioritas',
                'Status',
                'Masalah (terbuka)',
                'Rencana',
                'Departemen',
                'Pemohon',
                'Unit (pemohon)',
                'Petugas',
                'Tag',
                'Dibuat',
                'Ditutup',
                'Lama penyelesaian',
            ]);

            $query->orderBy('created_at', 'desc')->chunk(100, function ($tickets) use ($handle) {
                $this->addRequesterDepartemenToTickets($tickets);
                foreach ($tickets as $t) {
                    fputcsv($handle, [
                        $t->ticket_number,
                        $t->title,
                        $t->type?->name ?? '',
                        $t->category?->name ?? '',
                        $t->subcategory?->name ?? '',
                        $t->priority?->name ?? '',
                        $t->status?->name ?? '',
                        $this->formatOpenIssuesForCsvExport($t),
                        $t->project?->name ?? '',
                        $t->dep_id,
                        $t->requester?->name ?? '',
                        $t->requester?->departemen ?? '',
                        $t->assignee?->name ?? '',
                        $t->tags->pluck('name')->implode(', '),
                        $t->created_at?->format('Y-m-d H:i') ?? '',
                        $t->closed_at?->format('Y-m-d H:i') ?? '',
                        TicketResolutionDuration::format($t->created_at, $t->closed_at) ?? '',
                    ]);
                }
            });

            fclose($handle);
        }, $filename, [
            'Content-Type' => 'text/csv; charset=UTF-8',
        ]);
    }

    /**
     * Remove the specified ticket (soft delete or permanent).
     */
    public function destroy(Ticket $ticket): RedirectResponse
    {
        $this->authorize('delete', $ticket);

        $ticketNumber = $ticket->ticket_number;
        $ticket->delete();

        return redirect()
            ->route('tickets.index')
            ->with('success', "Tiket #{$ticketNumber} berhasil dihapus.");
    }

    /**
     * Halaman impor tiket dari CSV.
     */
    public function importForm(): Response
    {
        $this->authorize('create', Ticket::class);

        $user = request()->user();
        if (! $user->isAdmin() && ! $user->isStaff()) {
            abort(403, 'Hanya admin dan staff yang dapat mengimpor tiket.');
        }

        return Inertia::render('tickets/import', [
            'templateUrl' => route('tickets.import.template'),
        ]);
    }

    /**
     * Unduh template CSV untuk impor tiket.
     */
    public function importTemplate(): \Symfony\Component\HttpFoundation\StreamedResponse
    {
        $this->authorize('create', Ticket::class);

        $headers = [
            'Judul',
            'Tipe',
            'Kategori',
            'Prioritas',
            'Pemohon (email)',
            'Departemen',
            'Deskripsi',
        ];
        $example = [
            'Contoh: Monitor tidak menyala',
            'Permintaan',
            'Kerusakan perangkat',
            'Normal',
            'user@example.com',
            'IT',
            'Opsional',
        ];

        return ResponseFacade::streamDownload(function () use ($headers, $example) {
            $handle = fopen('php://output', 'w');
            fputcsv($handle, $headers);
            fputcsv($handle, $example);
            fclose($handle);
        }, 'template-import-tiket.csv', [
            'Content-Type' => 'text/csv; charset=UTF-8',
        ]);
    }

    /**
     * Proses impor tiket dari file CSV.
     */
    public function import(ImportTicketsRequest $request): RedirectResponse
    {
        $this->authorize('create', Ticket::class);

        $user = $request->user();
        $file = $request->file('file');

        $content = file_get_contents($file->getRealPath());
        if (str_starts_with($content, "\xEF\xBB\xBF")) {
            $content = substr($content, 3);
        }
        $lines = array_filter(explode("\n", $content), fn ($l) => trim($l) !== '');

        if (count($lines) < 2) {
            return redirect()
                ->route('tickets.import')
                ->with('error', 'File CSV harus memiliki baris header dan minimal satu baris data.');
        }

        $headerRow = str_getcsv(array_shift($lines));
        $headers = array_map(fn ($h) => trim(mb_strtolower((string) $h)), $headerRow);

        $newStatus = TicketStatus::where('slug', TicketStatus::SLUG_NEW)->first();
        if (! $newStatus) {
            return redirect()->route('tickets.import')->with('error', 'Status "Baru" tidak ditemukan.');
        }

        $created = 0;
        $errors = [];

        foreach ($lines as $index => $line) {
            $rowNum = $index + 2;
            $cells = str_getcsv($line);
            $row = [];
            foreach ($headers as $i => $key) {
                $row[$key] = isset($cells[$i]) ? trim((string) $cells[$i]) : '';
            }

            $title = $this->csvCell($row, 'judul', 'title');
            if ($title === '') {
                $errors[] = "Baris {$rowNum}: Judul wajib diisi.";

                continue;
            }

            $typeName = $this->csvCell($row, 'tipe', 'type');
            $type = $typeName !== ''
                ? TicketType::active()->where('name', $typeName)->first()
                : TicketType::active()->first();
            if (! $type) {
                $errors[] = "Baris {$rowNum}: Tipe \"{$typeName}\" tidak ditemukan.";

                continue;
            }

            $categoryName = $this->csvCell($row, 'kategori', 'category');
            $category = null;
            if ($categoryName !== '') {
                $category = TicketCategory::active()->where('name', $categoryName)->first();
                if (! $category) {
                    $errors[] = "Baris {$rowNum}: Kategori \"{$categoryName}\" tidak ditemukan.";

                    continue;
                }
            }

            $priorityName = $this->csvCell($row, 'prioritas', 'priority');
            $priority = $priorityName !== ''
                ? TicketPriority::active()->where('name', $priorityName)->first()
                : TicketPriority::active()->ordered()->first();
            if (! $priority) {
                $errors[] = "Baris {$rowNum}: Prioritas \"{$priorityName}\" tidak ditemukan.";

                continue;
            }

            $requesterEmail = $this->csvCell($row, 'pemohon (email)', 'pemohon', 'requester');
            $requester = $requesterEmail !== ''
                ? User::where('email', $requesterEmail)->first()
                : null;
            $requesterId = $requester?->id ?? $user->id;

            $depId = $this->csvCell($row, 'departemen', 'department');
            if ($depId === '' && $category) {
                $depId = $category->dep_id;
            }
            if ($depId === '') {
                $depId = 'IT';
            }

            $description = $this->csvCell($row, 'deskripsi', 'description');
            if (mb_strlen($description) > 10000) {
                $description = mb_substr($description, 0, 10000);
            }

            try {
                $slaDates = $this->calculateSlaDates($type->id, $priority->id, $category?->id);

                $ticket = Ticket::create([
                    'ticket_type_id' => $type->id,
                    'ticket_category_id' => $category?->id,
                    'ticket_subcategory_id' => null,
                    'ticket_priority_id' => $priority->id,
                    'ticket_status_id' => $newStatus->id,
                    'dep_id' => $depId,
                    'requester_id' => $requesterId,
                    'assignee_id' => null,
                    'title' => mb_substr($title, 0, 255),
                    'description' => $description !== '' ? $description : null,
                    'is_draft' => false,
                    'published_at' => now(),
                    'response_due_at' => $slaDates['response_due_at'],
                    'resolution_due_at' => $slaDates['resolution_due_at'],
                ]);
                $ticket->logActivity(TicketActivity::ACTION_CREATED, null, null, 'Tiket dibuat (impor CSV)', $user->id);
                TicketTelegramGroupNotifier::notifyNewTicket($ticket);
                $created++;
            } catch (\Throwable $e) {
                $errors[] = "Baris {$rowNum}: {$e->getMessage()}";
            }
        }

        if ($created > 0) {
            $msg = "{$created} tiket berhasil diimpor.";
            if (count($errors) > 0) {
                $msg .= ' Beberapa baris gagal: '.implode(' ', array_slice($errors, 0, 5));
                if (count($errors) > 5) {
                    $msg .= ' ... ('.count($errors).' error)';
                }
            }

            return redirect()->route('tickets.index')->with('success', $msg);
        }

        $errorMsg = count($errors) > 0
            ? implode("\n", array_slice($errors, 0, 20))
            : 'Tidak ada data yang valid untuk diimpor.';
        if (count($errors) > 20) {
            $errorMsg .= "\n... dan ".(count($errors) - 20).' error lainnya.';
        }

        return redirect()->route('tickets.import')->with('error', $errorMsg);
    }

    /**
     * Ambil nilai sel dari baris CSV (header dinormalisasi ke lowercase).
     *
     * @param  array<string, string>  $row
     * @param  string  ...$keys  Nama kolom yang dicoba (judul, title, dll.)
     */
    private function csvCell(array $row, string ...$keys): string
    {
        foreach ($keys as $key) {
            $k = mb_strtolower(trim($key));
            if (isset($row[$k])) {
                $v = $row[$k];

                return is_string($v) ? trim($v) : (string) $v;
            }
        }

        return '';
    }

    // ==================== HELPER METHODS ====================

    private function calculateSlaDates(int $typeId, int $priorityId, ?int $categoryId): array
    {
        $category = $categoryId ? TicketCategory::find($categoryId) : null;

        // Kategori pengembangan tidak pakai SLA otomatis
        if ($category?->is_development) {
            return [
                'response_due_at' => null,
                'resolution_due_at' => null,
            ];
        }

        // Cari SLA rule yang sesuai
        $slaRule = TicketSlaRule::active()
            ->where(function ($q) use ($typeId, $priorityId, $categoryId) {
                $q->where('ticket_type_id', $typeId)
                    ->where('ticket_priority_id', $priorityId);
                if ($categoryId) {
                    $q->where('ticket_category_id', $categoryId);
                } else {
                    $q->whereNull('ticket_category_id');
                }
            })
            ->orWhere(function ($q) use ($typeId, $priorityId) {
                $q->where('ticket_type_id', $typeId)
                    ->where('ticket_priority_id', $priorityId)
                    ->whereNull('ticket_category_id');
            })
            ->orWhere(function ($q) use ($priorityId) {
                $q->where('ticket_priority_id', $priorityId)
                    ->whereNull('ticket_type_id')
                    ->whereNull('ticket_category_id');
            })
            ->first();

        if (! $slaRule) {
            // Fallback ke priority default
            $priority = TicketPriority::find($priorityId);

            return [
                'response_due_at' => $priority?->response_hours ? now()->addHours($priority->response_hours) : null,
                'resolution_due_at' => $priority?->resolution_hours ? now()->addHours($priority->resolution_hours) : null,
            ];
        }

        return [
            'response_due_at' => $slaRule->response_minutes ? now()->addMinutes($slaRule->response_minutes) : null,
            'resolution_due_at' => $slaRule->resolution_minutes ? now()->addMinutes($slaRule->resolution_minutes) : null,
        ];
    }

    private function normalizeDraftPlanFields(Ticket $ticket): void
    {
        $updates = [];

        if (is_string($ticket->plan_ideas) && trim($ticket->plan_ideas) === '') {
            $updates['plan_ideas'] = null;
        }
        if (is_string($ticket->plan_tools) && trim($ticket->plan_tools) === '') {
            $updates['plan_tools'] = null;
        }
        if (is_string($ticket->budget_notes) && trim($ticket->budget_notes) === '') {
            $updates['budget_notes'] = null;
        }

        if ($updates !== []) {
            $ticket->forceFill($updates)->saveQuietly();
        }
    }

    /**
     * Simpan lampiran dari form buat tiket (multipart attachments[]).
     */
    private function storeAttachmentsFromCreateRequest(Request $request, Ticket $ticket): void
    {
        $files = $request->file('attachments', []);
        if ($files === []) {
            return;
        }

        foreach ($files as $file) {
            if ($file === null || ! $file->isValid()) {
                continue;
            }

            try {
                $attachment = TicketAttachmentStorageService::storeOnTicket(
                    $file,
                    $ticket,
                    $request->user()
                );
            } catch (\RuntimeException) {
                continue;
            }

            $ticket->logActivity(
                TicketActivity::ACTION_ATTACHMENT_ADDED,
                null,
                $attachment->filename,
                'Menambahkan lampiran'
            );
        }
    }
}
