<?php

namespace App\Http\Controllers;

use App\Models\EmergencyReport;
use App\Services\ResolveUserByNikService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
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
            ->with(['user', 'assignedOperator'])
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
            'address' => $r->address,
            'sender_name' => $r->sender_name ?? $r->user?->name,
            'sender_phone' => $r->sender_phone ?? $r->user?->phone,
            'created_at' => $r->created_at->toIso8601String(),
            'responded_at' => $r->responded_at?->toIso8601String(),
            'assigned_operator' => $r->assignedOperator?->name,
        ]);

        return Inertia::render('emergency-reports/index', [
            'reports' => $reports,
            'filters' => $request->only(['status', 'category', 'date_from', 'date_to', 'q']),
            'categories' => self::categoryLabels(),
            'statuses' => self::statusLabels(),
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

        EmergencyReport::create([
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

        $emergency_report->load(['user', 'assignedOperator']);

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
            'resolved_at' => $emergency_report->resolved_at?->toIso8601String(),
            'operator' => $emergency_report->assignedOperator ? [
                'id' => $emergency_report->assignedOperator->id,
                'name' => $emergency_report->assignedOperator->name,
                'phone' => $emergency_report->assignedOperator->phone,
            ] : null,
            'photo_url' => $emergency_report->photo_path
                ? \Illuminate\Support\Facades\Storage::disk('public')->url($emergency_report->photo_path)
                : null,
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
            'status' => ['required', 'string', 'in:responded,in_progress,resolved'],
            'notes' => ['nullable', 'string', 'max:5000'],
            'assigned_team' => ['nullable', 'string', 'max:255'],
        ])->validate();

        $emergency_report->update([
            'status' => $validated['status'],
            'response_notes' => $validated['notes'] ?? $emergency_report->response_notes,
            'assigned_team' => $validated['assigned_team'] ?? $emergency_report->assigned_team,
            'assigned_operator_id' => $emergency_report->assigned_operator_id ?? $request->user()->id,
            'responded_at' => $emergency_report->responded_at ?? now(),
            'resolved_at' => $validated['status'] === 'resolved' ? now() : $emergency_report->resolved_at,
        ]);

        return redirect()->route('emergency-reports.show', $emergency_report->report_id)
            ->with('success', 'Status laporan berhasil diperbarui.');
    }

    private function authorizeEmergency(): void
    {
        $user = request()->user();
        if (! $user->isAdmin() && ! $user->isStaff()) {
            abort(403, 'Hanya admin/staff yang dapat mengakses Laporan Darurat.');
        }
    }
}
