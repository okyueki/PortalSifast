<?php

namespace App\Http\Controllers;

use App\Events\EmergencyReportStatusChanged;
use App\Models\EmergencyReport;
use App\Models\OfficerLocation;
use App\Services\ResolveUserByNikService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Inertia\Inertia;
use Inertia\Response;

class EmergencyReportWebController extends Controller
{
    public static function categoryLabels(): array
    {
        return [
            'kecelakaan_lalu_lintas' => 'Kecelakaan Lalu Lintas',
            'ibu_hamil' => 'Ibu Hamil (darurat persalinan)',
            'serangan_jantung' => 'Serangan Jantung',
            'serangan_stroke' => 'Serangan Stroke',
            'home_care' => 'Request Home Care',
            'ambulance' => 'Request Ambulance',
        ];
    }

    public static function statusLabels(): array
    {
        return [
            'pending' => 'Menunggu',
            'responded' => 'Sudah Direspons',
            'in_progress' => 'Dalam Penanganan',
            'arrived' => 'Sampai',
            'resolved' => 'Selesai',
            'cancelled' => 'Dibatalkan',
        ];
    }

    public function __construct(
        private ResolveUserByNikService $resolveUserByNik
    ) {}

    public function index(Request $request): Response
    {
        $this->authorizeEmergency();

        $query = EmergencyReport::query()
            ->with(['user', 'assignedOperator', 'officerLocations' => function ($q) {
                $q->latest()->limit(1);
            }])
            ->orderByDesc('created_at');

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }
        if ($request->filled('category')) {
            $query->where('category', $request->input('category'));
        }
        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->input('date_from'));
        }
        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->input('date_to'));
        }
        if ($request->filled('q')) {
            $q = '%'.$request->input('q').'%';
            $query->where(function ($qry) use ($q) {
                $qry->where('report_id', 'like', $q)
                    ->orWhere('address', 'like', $q)
                    ->orWhere('sender_name', 'like', $q)
                    ->orWhereHas('user', fn ($u) => $u->where('name', 'like', $q)->orWhere('simrs_nik', 'like', $q));
            });
        }

        $reports = $query->paginate(20)->withQueryString()->through(fn (EmergencyReport $r) => [
            'report_id' => $r->report_id,
            'status' => $r->status,
            'category' => $r->category,
            'latitude' => (float) $r->latitude,
            'longitude' => (float) $r->longitude,
            'address' => $r->address,
            'sender_name' => $r->sender_name ?? $r->user?->name,
            'sender_phone' => $r->sender_phone ?? $r->user?->phone,
            'created_at' => $r->created_at->toIso8601String(),
            'responded_at' => $r->responded_at?->toIso8601String(),
            'assigned_operator' => $r->assignedOperator?->name,
            'waiting_minutes' => $r->created_at->diffInMinutes(now()),
            'officer_location' => $r->officerLocations->first() ? [
                'latitude' => (float) $r->officerLocations->first()->latitude,
                'longitude' => (float) $r->officerLocations->first()->longitude,
                'eta_minutes' => $r->officerLocations->first()->eta_minutes,
                'distance_meters' => $r->officerLocations->first()->distance_meters,
            ] : null,
        ]);

        // Get active officers for map display
        $activeOfficers = $this->getActiveOfficers();

        // Get statistics
        $stats = $this->getStats();

        return Inertia::render('emergency-reports/index', [
            'reports' => $reports,
            'filters' => $request->only(['status', 'category', 'date_from', 'date_to', 'q']),
            'categories' => self::categoryLabels(),
            'statuses' => self::statusLabels(),
            'activeOfficers' => $activeOfficers,
            'stats' => $stats,
        ]);
    }

    public function create(): Response
    {
        $this->authorizeEmergency();

        return Inertia::render('emergency-reports/create', [
            'categories' => self::categoryLabels(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $this->authorizeEmergency();

        $validated = Validator::make($request->all(), [
            'nik' => ['required', 'string', 'max:50'],
            'latitude' => ['required', 'numeric', 'between:-90,90'],
            'longitude' => ['required', 'numeric', 'between:-180,180'],
            'address' => ['required', 'string', 'max:1000'],
            'category' => ['required', 'string', 'in:'.implode(',', EmergencyReport::CATEGORIES)],
            'sender_name' => ['nullable', 'string', 'max:255'],
            'sender_phone' => ['nullable', 'string', 'max:50'],
            'notes' => ['nullable', 'string', 'max:5000'],
        ])->validate();

        $user = $this->resolveUserByNik->findOrCreate($validated['nik']);
        if (! $user) {
            return redirect()->back()->withErrors(['nik' => 'Pegawai dengan NIK tersebut tidak ditemukan di SIMRS.']);
        }

        $report = EmergencyReport::create([
            'user_id' => $user->id,
            'latitude' => $validated['latitude'],
            'longitude' => $validated['longitude'],
            'address' => $validated['address'],
            'category' => $validated['category'],
            'status' => EmergencyReport::STATUS_PENDING,
            'sender_name' => $validated['sender_name'] ?? $user->name,
            'sender_phone' => $validated['sender_phone'] ?? $user->phone,
            'notes' => $validated['notes'] ?? null,
        ]);

        return redirect()->route('emergency-reports.index')->with('success', 'Laporan darurat berhasil dicatat.');
    }

    public function show(EmergencyReport $emergency_report): Response
    {
        $this->authorizeEmergency();

        $emergency_report->load(['user', 'assignedOperator', 'officerLocations' => function ($q) {
            $q->latest()->limit(10); // Last 10 locations for tracking history
        }]);

        $latestLocation = $emergency_report->officerLocations->first();

        $report = [
            'report_id' => $emergency_report->report_id,
            'status' => $emergency_report->status,
            'category' => $emergency_report->category,
            'latitude' => (float) $emergency_report->latitude,
            'longitude' => (float) $emergency_report->longitude,
            'address' => $emergency_report->address,
            'sender_name' => $emergency_report->sender_name ?? $emergency_report->user?->name,
            'sender_phone' => $emergency_report->sender_phone ?? $emergency_report->user?->phone,
            'notes' => $emergency_report->notes,
            'response_notes' => $emergency_report->response_notes,
            'assigned_team' => $emergency_report->assigned_team,
            'created_at' => $emergency_report->created_at->toIso8601String(),
            'responded_at' => $emergency_report->responded_at?->toIso8601String(),
            'arrived_at' => $emergency_report->arrived_at?->toIso8601String(),
            'resolved_at' => $emergency_report->resolved_at?->toIso8601String(),
            'destination_type' => $emergency_report->destination_type,
            'destination_name' => $emergency_report->destination_name,
            'waiting_minutes' => $emergency_report->created_at->diffInMinutes(now()),
            'operator' => $emergency_report->assignedOperator ? [
                'id' => $emergency_report->assignedOperator->id,
                'name' => $emergency_report->assignedOperator->name,
                'phone' => $emergency_report->assignedOperator->phone,
            ] : null,
            'photo_url' => $emergency_report->photo_path
                ? \Illuminate\Support\Facades\Storage::disk('public')->url($emergency_report->photo_path)
                : null,
            'officer_location' => $latestLocation ? [
                'latitude' => (float) $latestLocation->latitude,
                'longitude' => (float) $latestLocation->longitude,
                'eta_minutes' => $latestLocation->eta_minutes,
                'distance_meters' => $latestLocation->distance_meters,
                'speed_kmh' => $latestLocation->speed_kmh,
                'updated_at' => $latestLocation->updated_at->toIso8601String(),
            ] : null,
            'location_history' => $emergency_report->officerLocations->map(fn ($loc) => [
                'latitude' => (float) $loc->latitude,
                'longitude' => (float) $loc->longitude,
                'speed_kmh' => $loc->speed_kmh,
                'eta_minutes' => $loc->eta_minutes,
                'distance_meters' => $loc->distance_meters,
                'updated_at' => $loc->updated_at->toIso8601String(),
            ])->toArray(),
        ];

        return Inertia::render('emergency-reports/show', [
            'report' => $report,
            'statuses' => self::statusLabels(),
            'categories' => self::categoryLabels(),
        ]);
    }

    public function respond(Request $request, EmergencyReport $emergency_report): RedirectResponse
    {
        $this->authorizeEmergency();

        $validated = Validator::make($request->all(), [
            'status' => ['required', 'string', 'in:responded,in_progress,arrived,resolved'],
            'notes' => ['nullable', 'string', 'max:5000'],
            'assigned_team' => ['nullable', 'string', 'max:255'],
            'destination_type' => ['nullable', 'string', 'in:rs_kita,rujuk'],
            'destination_name' => ['nullable', 'string', 'max:255'],
        ])->validate();

        $previousStatus = $emergency_report->status;

        $payload = [
            'status' => $validated['status'],
            'response_notes' => $validated['notes'] ?? $emergency_report->response_notes,
            'assigned_team' => $validated['assigned_team'] ?? $emergency_report->assigned_team,
            'assigned_operator_id' => $emergency_report->assigned_operator_id ?? $request->user()->id,
            'responded_at' => $emergency_report->responded_at ?? now(),
        ];

        if ($validated['status'] === 'arrived') {
            $payload['arrived_at'] = $emergency_report->arrived_at ?? now();
        }

        if ($validated['status'] === 'resolved') {
            $payload['resolved_at'] = $emergency_report->resolved_at ?? now();
            $payload['destination_type'] = $validated['destination_type'] ?? null;
            $payload['destination_name'] = $validated['destination_name'] ?? null;
        } elseif ($validated['status'] !== 'arrived') {
            $payload['destination_type'] = null;
            $payload['destination_name'] = null;
            $payload['arrived_at'] = null;
        }

        $emergency_report->update($payload);

        // Broadcast status change via WebSocket
        EmergencyReportStatusChanged::dispatch(
            $emergency_report->fresh(),
            $previousStatus,
            $request->user()->name
        );

        return redirect()->route('emergency-reports.show', $emergency_report->report_id)
            ->with('success', 'Status laporan berhasil diperbarui.');
    }

    /**
     * Get active officers with their latest location.
     *
     * @return array<int, array<string, mixed>>
     */
    private function getActiveOfficers(): array
    {
        $fiveMinutesAgo = now()->subMinutes(5);

        $officerIds = OfficerLocation::query()
            ->where('updated_at', '>=', $fiveMinutesAgo)
            ->distinct()
            ->pluck('officer_id')
            ->toArray();

        $activeOfficers = [];
        foreach ($officerIds as $officerId) {
            $latestLocation = OfficerLocation::query()
                ->where('officer_id', $officerId)
                ->latest()
                ->first();

            if ($latestLocation) {
                $activeOfficers[] = [
                    'officer_id' => $latestLocation->officer_id,
                    'officer_name' => $latestLocation->officer?->name,
                    'officer_phone' => $latestLocation->officer?->phone,
                    'report_id' => $latestLocation->emergencyReport?->report_id,
                    'latitude' => (float) $latestLocation->latitude,
                    'longitude' => (float) $latestLocation->longitude,
                    'speed_kmh' => $latestLocation->speed_kmh,
                    'eta_minutes' => $latestLocation->eta_minutes,
                    'distance_meters' => $latestLocation->distance_meters,
                    'updated_at' => $latestLocation->updated_at->toIso8601String(),
                ];
            }
        }

        return $activeOfficers;
    }

    /**
     * Get statistics for dashboard.
     *
     * @return array<string, mixed>
     */
    private function getStats(): array
    {
        $activeStatuses = [
            EmergencyReport::STATUS_PENDING,
            EmergencyReport::STATUS_RESPONDED,
            EmergencyReport::STATUS_IN_PROGRESS,
            EmergencyReport::STATUS_ARRIVED,
        ];

        // Total active reports by status
        $statusCounts = EmergencyReport::query()
            ->select('status', DB::raw('count(*) as count'))
            ->whereIn('status', $activeStatuses)
            ->groupBy('status')
            ->pluck('count', 'status')
            ->toArray();

        // Reports waiting more than 5 minutes
        $longWaiting = EmergencyReport::query()
            ->where('status', EmergencyReport::STATUS_PENDING)
            ->where('created_at', '<=', now()->subMinutes(5))
            ->count();

        // Average response time
        $avgResponseTime = EmergencyReport::query()
            ->whereNotNull('responded_at')
            ->whereNotNull('created_at')
            ->selectRaw('AVG(TIMESTAMPDIFF(MINUTE, created_at, responded_at)) as avg_minutes')
            ->value('avg_minutes');

        // Today's reports
        $todayCount = EmergencyReport::query()
            ->whereDate('created_at', today())
            ->count();

        $todayResolved = EmergencyReport::query()
            ->whereDate('resolved_at', today())
            ->count();

        // Active officers count
        $fiveMinutesAgo = now()->subMinutes(5);
        $activeOfficersCount = OfficerLocation::query()
            ->where('updated_at', '>=', $fiveMinutesAgo)
            ->distinct()
            ->count('officer_id');

        return [
            'by_status' => [
                'pending' => $statusCounts[EmergencyReport::STATUS_PENDING] ?? 0,
                'responded' => $statusCounts[EmergencyReport::STATUS_RESPONDED] ?? 0,
                'in_progress' => $statusCounts[EmergencyReport::STATUS_IN_PROGRESS] ?? 0,
                'arrived' => $statusCounts[EmergencyReport::STATUS_ARRIVED] ?? 0,
            ],
            'total_active' => array_sum($statusCounts),
            'long_waiting' => $longWaiting,
            'avg_response_time_minutes' => round($avgResponseTime ?? 0, 1),
            'today' => [
                'total' => $todayCount,
                'resolved' => $todayResolved,
            ],
            'active_officers' => $activeOfficersCount,
        ];
    }

    private function authorizeEmergency(): void
    {
        $user = request()->user();
        if (! $user->isAdmin() && ! $user->isStaff()) {
            abort(403, 'Hanya admin/staff yang dapat mengakses Laporan Darurat.');
        }
    }

    /**
     * Staff Mobile - Panic Button Acceptance Page
     * Staff can see pending panic reports and accept them
     */
    public function staff(): Response
    {
        $user = request()->user();

        // Get pending reports (not yet accepted)
        $pendingReports = EmergencyReport::query()
            ->where('status', EmergencyReport::STATUS_PENDING)
            ->whereNull('assigned_operator_id')
            ->orderBy('created_at', 'asc')
            ->get()
            ->map(fn (EmergencyReport $r) => [
                'report_id' => $r->report_id,
                'category' => $r->category,
                'latitude' => (float) $r->latitude,
                'longitude' => (float) $r->longitude,
                'address' => $r->address,
                'sender_name' => $r->sender_name ?? $r->user?->name,
                'sender_phone' => $r->sender_phone ?? $r->user?->phone,
                'status' => $r->status,
                'created_at' => $r->created_at->toIso8601String(),
            ])
            ->toArray();

        return Inertia::render('emergency-reports/staff', [
            'pendingReports' => $pendingReports,
            'categories' => self::categoryLabels(),
            'staffName' => $user->name,
        ]);
    }
}