<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\StoreTicketApiRequest;
use App\Http\Requests\Api\StoreTicketCommentApiRequest;
use App\Models\Pegawai;
use App\Models\Ticket;
use App\Models\TicketActivity;
use App\Models\TicketCategory;
use App\Models\TicketPriority;
use App\Models\TicketSlaRule;
use App\Models\TicketStatus;
use App\Models\TicketType;
use App\Models\User;
use App\Notifications\TicketCommentNotification;
use App\Notifications\TicketCreatedNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ApiTicketController extends Controller
{
    /**
     * Buat tiket baru dari aplikasi kepegawaian (identifikasi pakai NIK).
     */
    public function store(StoreTicketApiRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $nik = $validated['nik'];

        // Cari atau buat user berdasarkan NIK
        $requester = $this->findOrCreateUserByNik($nik);

        if (! $requester) {
            return response()->json([
                'success' => false,
                'message' => 'Pegawai dengan NIK tersebut tidak ditemukan di SIMRS atau belum terdaftar.',
            ], 404);
        }

        // Set default type dan priority jika tidak diisi
        $typeId = $validated['ticket_type_id'] ?? TicketType::active()->first()?->id;
        $priorityId = $validated['ticket_priority_id'] ?? TicketPriority::active()->orderBy('level', 'desc')->first()?->id;

        // Get category untuk menentukan dep_id
        $category = isset($validated['ticket_category_id'])
            ? TicketCategory::find($validated['ticket_category_id'])
            : null;

        // Get status "Baru"
        $newStatus = TicketStatus::where('slug', TicketStatus::SLUG_NEW)->first();

        // Calculate SLA due dates
        $slaDates = $this->calculateSlaDates(
            $typeId,
            $priorityId,
            $validated['ticket_category_id'] ?? null
        );

        // Determine department: from category if set, otherwise default to IT
        $depId = $category?->dep_id ?? 'IT';

        $ticket = Ticket::create([
            'ticket_type_id' => $typeId,
            'ticket_category_id' => $validated['ticket_category_id'] ?? null,
            'ticket_subcategory_id' => $validated['ticket_subcategory_id'] ?? null,
            'ticket_priority_id' => $priorityId,
            'ticket_status_id' => $newStatus->id,
            'dep_id' => $depId,
            'requester_id' => $requester->id,
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

        // Log activity
        $ticket->logActivity(TicketActivity::ACTION_CREATED, null, null, 'Tiket dibuat via API');

        // Notify staff in department
        $staffInDept = User::where('role', 'staff')->where('dep_id', $depId)->get();
        foreach ($staffInDept as $staff) {
            $staff->notify(new TicketCreatedNotification($ticket));
        }

        $ticket->load(['type', 'category', 'priority', 'status', 'requester']);

        return response()->json([
            'success' => true,
            'message' => 'Tiket berhasil dibuat.',
            'data' => [
                'id' => $ticket->id,
                'ticket_number' => $ticket->ticket_number,
                'title' => $ticket->title,
                'status' => $ticket->status->name,
                'priority' => $ticket->priority->name,
                'created_at' => $ticket->created_at->toIso8601String(),
            ],
        ], 201);
    }

    /**
     * Daftar tiket milik NIK tertentu.
     */
    public function index(Request $request): JsonResponse
    {
        $request->validate([
            'nik' => ['required', 'string'],
        ]);

        $nik = $request->input('nik');

        // Cari user by NIK
        $requester = User::where('simrs_nik', $nik)->first();

        if (! $requester) {
            return response()->json([
                'success' => false,
                'message' => 'Pegawai dengan NIK tersebut belum terdaftar di PortalSifast.',
                'data' => [],
            ]);
        }

        $tickets = Ticket::query()
            ->where('requester_id', $requester->id)
            ->with(['type', 'category', 'priority', 'status'])
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(fn (Ticket $t) => [
                'id' => $t->id,
                'ticket_number' => $t->ticket_number,
                'title' => $t->title,
                'type' => $t->type->name,
                'category' => $t->category?->name,
                'priority' => $t->priority->name,
                'status' => $t->status->name,
                'created_at' => $t->created_at->toIso8601String(),
                'updated_at' => $t->updated_at->toIso8601String(),
            ]);

        return response()->json([
            'success' => true,
            'data' => $tickets,
        ]);
    }

    /**
     * Daftar tiket dengan pagination (untuk frontend kepegawaian).
     */
    public function indexPaginated(Request $request): JsonResponse
    {
        $request->validate([
            'nik' => ['required', 'string'],
            'page' => ['nullable', 'integer', 'min:1'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
            'status' => ['nullable', 'integer'],
            'priority' => ['nullable', 'integer'],
        ]);

        $nik = $request->input('nik');
        $perPage = $request->input('per_page', 15);

        // Cari user by NIK
        $requester = User::where('simrs_nik', $nik)->first();

        if (! $requester) {
            return response()->json([
                'success' => false,
                'message' => 'Pegawai dengan NIK tersebut belum terdaftar di PortalSifast.',
                'data' => [],
                'meta' => ['current_page' => 1, 'last_page' => 1, 'per_page' => $perPage, 'total' => 0],
            ]);
        }

        $query = Ticket::query()
            ->where('requester_id', $requester->id)
            ->with(['type', 'category', 'priority', 'status', 'assignee']);

        // Filter by status
        if ($request->filled('status')) {
            $query->where('ticket_status_id', $request->input('status'));
        }

        // Filter by priority
        if ($request->filled('priority')) {
            $query->where('ticket_priority_id', $request->input('priority'));
        }

        $tickets = $query
            ->orderBy('created_at', 'desc')
            ->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $tickets->map(fn (Ticket $t) => [
                'id' => $t->id,
                'ticket_number' => $t->ticket_number,
                'title' => $t->title,
                'description' => $t->description,
                'type' => $t->type->name,
                'type_id' => $t->ticket_type_id,
                'category' => $t->category?->name,
                'category_id' => $t->ticket_category_id,
                'priority' => $t->priority->name,
                'priority_id' => $t->ticket_priority_id,
                'priority_color' => $t->priority->color,
                'status' => $t->status->name,
                'status_id' => $t->ticket_status_id,
                'status_color' => $t->status->color,
                'is_closed' => $t->status->is_closed,
                'assignee' => $t->assignee?->name,
                'created_at' => $t->created_at->toIso8601String(),
                'updated_at' => $t->updated_at->toIso8601String(),
            ]),
            'meta' => [
                'current_page' => $tickets->currentPage(),
                'last_page' => $tickets->lastPage(),
                'per_page' => $tickets->perPage(),
                'total' => $tickets->total(),
            ],
        ]);
    }

    /**
     * Detail tiket (hanya jika requester-nya sesuai NIK).
     */
    public function show(Request $request, Ticket $ticket): JsonResponse
    {
        $request->validate([
            'nik' => ['required', 'string'],
        ]);

        $nik = $request->input('nik');
        $requester = User::where('simrs_nik', $nik)->first();

        if (! $requester || $ticket->requester_id !== $requester->id) {
            return response()->json([
                'success' => false,
                'message' => 'Tiket tidak ditemukan atau tidak dapat diakses.',
            ], 404);
        }

        $ticket->load([
            'type',
            'category',
            'subcategory',
            'priority',
            'status',
            'requester',
            'assignee',
            'tags',
            'comments' => fn ($q) => $q->with('user')->orderBy('created_at', 'asc'),
        ]);

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $ticket->id,
                'ticket_number' => $ticket->ticket_number,
                'title' => $ticket->title,
                'description' => $ticket->description,
                'type' => $ticket->type->name,
                'category' => $ticket->category?->name,
                'subcategory' => $ticket->subcategory?->name,
                'priority' => $ticket->priority->name,
                'status' => $ticket->status->name,
                'assignee' => $ticket->assignee?->name,
                'tags' => $ticket->tags->map(fn ($t) => $t->name),
                'comments' => $ticket->comments->map(fn ($c) => [
                    'id' => $c->id,
                    'body' => $c->body,
                    'user' => $c->user->name,
                    'is_internal' => $c->is_internal,
                    'created_at' => $c->created_at->toIso8601String(),
                ]),
                'created_at' => $ticket->created_at->toIso8601String(),
                'updated_at' => $ticket->updated_at->toIso8601String(),
            ],
        ]);
    }

    /**
     * Tambah komentar pada tiket (hanya requester yang sesuai NIK).
     */
    public function storeComment(StoreTicketCommentApiRequest $request, Ticket $ticket): JsonResponse
    {
        $validated = $request->validated();
        $nik = $validated['nik'];

        $requester = User::where('simrs_nik', $nik)->first();

        if (! $requester) {
            return response()->json([
                'success' => false,
                'message' => 'Pegawai dengan NIK tersebut belum terdaftar di PortalSifast.',
            ], 404);
        }

        if ($ticket->requester_id !== $requester->id) {
            return response()->json([
                'success' => false,
                'message' => 'Tiket tidak ditemukan atau tidak dapat diakses.',
            ], 404);
        }

        $comment = $ticket->comments()->create([
            'user_id' => $requester->id,
            'body' => $validated['body'],
            'is_internal' => false, // Pelapor via API hanya bisa komentar publik
        ]);

        $ticket->logActivity(
            TicketActivity::ACTION_COMMENTED,
            null,
            'Public comment',
            'Komentar ditambahkan via API'
        );

        $toNotify = collect([$ticket->requester, $ticket->assignee])
            ->filter()
            ->unique('id')
            ->reject(fn ($u) => $u->id === $requester->id);

        foreach ($toNotify as $recipient) {
            $recipient->notify(new TicketCommentNotification($ticket, $comment));
        }

        return response()->json([
            'success' => true,
            'message' => 'Komentar berhasil ditambahkan.',
            'data' => [
                'id' => $comment->id,
                'body' => $comment->body,
                'created_at' => $comment->created_at->toIso8601String(),
            ],
        ], 201);
    }

    /**
     * Get data user (nama, email, dll.) berdasarkan NIK.
     * Untuk kepegawaian: setelah user login dengan NIK di aplikasi mereka,
     * panggil endpoint ini dengan Bearer token + query nik untuk dapat nama/dep dll.
     * Jika user belum ada di PortalSifast, akan auto-create dari data Pegawai (SIMRS).
     */
    public function userByNik(Request $request): JsonResponse
    {
        $request->validate([
            'nik' => ['required', 'string', 'max:50'],
        ]);

        $nik = $request->input('nik');
        $user = $this->findOrCreateUserByNik($nik);

        if (! $user) {
            return response()->json([
                'success' => false,
                'message' => 'Pegawai dengan NIK tersebut tidak ditemukan di SIMRS atau belum terdaftar.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'simrs_nik' => $user->simrs_nik,
                'phone' => $user->phone,
                'dep_id' => $user->dep_id,
                'role' => $user->role,
            ],
        ]);
    }

    /**
     * Cari atau buat user berdasarkan NIK.
     * Ambil data dari Pegawai (SIMRS) jika ada.
     */
    private function findOrCreateUserByNik(string $nik): ?User
    {
        // Cek apakah user sudah ada
        $user = User::where('simrs_nik', $nik)->first();

        if ($user) {
            return $user;
        }

        // Cari di master Pegawai (SIMRS)
        try {
            $pegawai = Pegawai::where('nik', $nik)
                ->where('stts_aktif', 'AKTIF')
                ->first();

            if (! $pegawai) {
                return null;
            }

            // Ambil email dan phone dari relasi
            $email = $pegawai->getEmailForSync();
            $phone = $pegawai->getPhoneForSync();

            // Buat user baru (role pemohon)
            $user = User::create([
                'simrs_nik' => $nik,
                'name' => $pegawai->nama ?? $nik,
                'email' => $email ?? "{$nik}@portal.local",
                'password' => bcrypt(str()->random(32)), // Random password, tidak akan dipakai untuk login
                'phone' => $phone,
                'source' => 'simrs',
                'role' => 'pemohon',
                'dep_id' => $pegawai->departemen ?? null,
            ]);

            return $user;
        } catch (\Throwable $e) {
            // Jika koneksi SIMRS gagal, return null
            return null;
        }
    }

    /**
     * Calculate SLA due dates (copy dari TicketController).
     */
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
