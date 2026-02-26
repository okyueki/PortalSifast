<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreTicketRequest;
use App\Http\Requests\UpdateTicketRequest;
use App\Models\Inventaris;
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
            ->with(['type', 'category', 'priority', 'status', 'requester', 'assignee', 'group', 'tags']);

        // Filter berdasarkan role
        if ($user->isPemohon()) {
            // Pemohon hanya bisa lihat tiket sendiri
            $query->where('requester_id', $user->id);
        } elseif ($user->isStaff()) {
            // Staff bisa lihat tiket departemennya, ditugaskan ke dia, rekan, atau grupnya
            $groupIds = \App\Models\TicketGroup::whereHas('members', fn ($q) => $q->where('user_id', $user->id))->pluck('id');
            $query->where(function ($q) use ($user, $groupIds) {
                $q->where('dep_id', $user->dep_id)
                    ->orWhere('assignee_id', $user->id)
                    ->orWhere('requester_id', $user->id)
                    ->orWhereHas('collaborators', fn ($q) => $q->where('user_id', $user->id))
                    ->orWhereIn('ticket_group_id', $groupIds);
            });
        }
        // Admin bisa lihat semua

        // Filter by status
        if ($request->filled('status')) {
            $query->where('ticket_status_id', $request->status);
        }

        // Filter by priority
        if ($request->filled('priority')) {
            $query->where('ticket_priority_id', $request->priority);
        }

        // Filter by department
        if ($request->filled('department') && $user->isAdmin()) {
            $query->where('dep_id', $request->department);
        }

        // Filter by assignee
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

        // Search
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('ticket_number', 'like', "%{$search}%")
                    ->orWhere('title', 'like', "%{$search}%");
            });
        }

        // Filter by tag
        if ($request->filled('tag')) {
            $query->whereHas('tags', fn ($q) => $q->where('ticket_tags.id', $request->tag));
        }

        $tickets = $query
            ->orderBy('created_at', 'desc')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('tickets/index', [
            'tickets' => $tickets,
            'statuses' => TicketStatus::active()->ordered()->get(),
            'priorities' => TicketPriority::active()->ordered()->get(),
            'tags' => TicketTag::where('is_active', true)->orderBy('name')->get(['id', 'name', 'slug']),
            'filters' => $request->only(['status', 'priority', 'department', 'assignee', 'search', 'tag']),
            'canExport' => $user->isAdmin() || $user->isStaff(),
            'canDelete' => $user->isAdmin(),
        ]);
    }

    /**
     * Papan Kanban: daftar tiket per status (view saja, data dari Ticket).
     */
    public function board(Request $request): Response
    {
        $user = $request->user();

        $query = Ticket::query()
            ->with(['type', 'category', 'priority', 'status', 'requester', 'assignee', 'tags'])
            ->open();

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
    public function create(): Response
    {
        $user = request()->user();

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

        return Inertia::render('tickets/create', [
            'types' => TicketType::active()->get(),
            'categories' => $categoriesQuery->get(),
            'priorities' => TicketPriority::active()->ordered()->get(),
            'tags' => TicketTag::where('is_active', true)->orderBy('name')->get(['id', 'name', 'slug']),
            'recentTicketsForLink' => $recentTicketsForLink,
            'canSelectRequester' => $user->isAdmin(),
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
     * Search users for requester selector (admin only).
     */
    public function searchForUser(Request $request): \Illuminate\Http\JsonResponse
    {
        // Hanya admin yang bisa memilih pemohon
        if (! $request->user()?->isAdmin()) {
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
        $query = Ticket::query();

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
        $slaDates = $this->calculateSlaDates(
            $validated['ticket_type_id'],
            $validated['ticket_priority_id'],
            $validated['ticket_category_id'] ?? null
        );

        // Determine department: from category if set, otherwise default to IT
        $depId = $category?->dep_id ?? 'IT';

        // Tentukan requester: admin bisa pilih manual, user biasa = diri sendiri
        $requesterId = $user->id;
        if ($user->isAdmin() && ! empty($validated['requester_id'])) {
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

        // Log activity
        $ticket->logActivity(TicketActivity::ACTION_CREATED, null, null, 'Tiket dibuat');

        // Notify staff in department
        $staffInDept = User::where('role', 'staff')->where('dep_id', $depId)->get();
        foreach ($staffInDept as $staff) {
            $staff->notify(new TicketCreatedNotification($ticket));
        }

        return redirect()
            ->route('tickets.show', $ticket)
            ->with('success', "Tiket #{$ticket->ticket_number} berhasil dibuat.");
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
            'relatedTicket',
            'tags',
            'inventaris.barang',
            'inventaris.ruang',
            'collaborators.user',
            'comments' => fn ($q) => $q->visibleTo($user)->with('user')->orderBy('created_at', 'asc'),
            'attachments.user',
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
        ]);
    }

    /**
     * Show the form for editing the specified ticket.
     */
    public function edit(Ticket $ticket): Response
    {
        $this->authorize('update', $ticket);

        $user = request()->user();

        $ticket->load(['type', 'category', 'subcategory', 'priority', 'status', 'requester', 'tags', 'inventaris.barang', 'inventaris.ruang']);

        return Inertia::render('tickets/edit', [
            'ticket' => $ticket,
            'types' => TicketType::active()->get(),
            'categories' => TicketCategory::active()->with('subcategories')->get(),
            'priorities' => TicketPriority::active()->ordered()->get(),
            'statuses' => TicketStatus::active()->ordered()->get(),
            'tags' => TicketTag::where('is_active', true)->orderBy('name')->get(['id', 'name', 'slug']),
            'canDelete' => $user->can('delete', $ticket),
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
                    $changes[] = ['action' => TicketActivity::ACTION_ASSIGNED, 'old' => $oldAssignee, 'new' => $newAssignee->name];

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
                } else {
                    $changes[] = ['action' => TicketActivity::ACTION_UNASSIGNED, 'old' => $oldAssignee, 'new' => null];
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

        $ticket->save();

        // Log all changes
        foreach ($changes as $change) {
            $ticket->logActivity($change['action'], $change['old'], $change['new']);
        }

        return redirect()
            ->route('tickets.show', $ticket)
            ->with('success', 'Tiket berhasil diperbarui.');
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

        return redirect()
            ->route('tickets.show', $ticket)
            ->with('success', 'Tiket berhasil diambil.');
    }

    /**
     * Close ticket (quick action).
     */
    public function close(Ticket $ticket): RedirectResponse
    {
        $this->authorize('changeStatus', $ticket);

        $user = request()->user();

        $oldStatus = $ticket->status->name;
        $closedStatus = TicketStatus::where('slug', TicketStatus::SLUG_CLOSED)->first();

        $ticket->ticket_status_id = $closedStatus->id;
        $ticket->closed_at = now();
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
            ->with(['type', 'category', 'priority', 'status', 'requester', 'assignee']);

        if ($user->isStaff()) {
            $query->where(function ($q) use ($user) {
                $q->where('dep_id', $user->dep_id)
                    ->orWhere('assignee_id', $user->id)
                    ->orWhere('requester_id', $user->id);
            });
        }

        if ($request->filled('status')) {
            $query->where('ticket_status_id', $request->status);
        }
        if ($request->filled('department')) {
            $query->where('dep_id', $request->department);
        }
        if ($request->filled('from')) {
            $query->whereDate('created_at', '>=', $request->from);
        }
        if ($request->filled('to')) {
            $query->whereDate('created_at', '<=', $request->to);
        }

        $filename = 'tickets-'.now()->format('Y-m-d-His').'.csv';

        return ResponseFacade::streamDownload(function () use ($query) {
            $handle = fopen('php://output', 'w');
            fputcsv($handle, [
                'No. Tiket',
                'Judul',
                'Tipe',
                'Kategori',
                'Prioritas',
                'Status',
                'Departemen',
                'Pemohon',
                'Petugas',
                'Dibuat',
                'Ditutup',
            ]);

            $query->orderBy('created_at', 'desc')->chunk(100, function ($tickets) use ($handle) {
                foreach ($tickets as $t) {
                    fputcsv($handle, [
                        $t->ticket_number,
                        $t->title,
                        $t->type?->name ?? '',
                        $t->category?->name ?? '',
                        $t->priority?->name ?? '',
                        $t->status?->name ?? '',
                        $t->dep_id,
                        $t->requester?->name ?? '',
                        $t->assignee?->name ?? '',
                        $t->created_at?->format('Y-m-d H:i') ?? '',
                        $t->closed_at?->format('Y-m-d H:i') ?? '',
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
}
