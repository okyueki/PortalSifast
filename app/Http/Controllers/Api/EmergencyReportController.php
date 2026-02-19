<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\CancelEmergencyReportRequest;
use App\Http\Requests\Api\RespondEmergencyReportRequest;
use App\Http\Requests\Api\StoreEmergencyReportRequest;
use App\Models\EmergencyReport;
use App\Models\User;
use App\Services\ResolveUserByNikService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

class EmergencyReportController extends Controller
{
    public function __construct(
        private ResolveUserByNikService $resolveUserByNik
    ) {}

    /**
     * Kirim laporan darurat (panic button).
     */
    public function store(StoreEmergencyReportRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $nik = $validated['nik'];

        $user = $this->resolveUserByNik->findOrCreate($nik);

        if (! $user) {
            return response()->json([
                'success' => false,
                'message' => 'Pegawai dengan NIK tersebut tidak ditemukan di SIMRS atau belum terdaftar.',
            ], 404);
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
            'device_id' => $validated['device_id'] ?? null,
            'notes' => $validated['notes'] ?? null,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Laporan berhasil diterima',
            'data' => [
                'report_id' => $report->report_id,
                'status' => $report->status,
                'assigned_operator' => null,
                'estimated_response_minutes' => 5,
                'created_at' => $report->created_at->toIso8601String(),
            ],
        ], 201);
    }

    /**
     * Cek status laporan (hanya pemilik by NIK).
     */
    public function show(Request $request, EmergencyReport $emergency_report): JsonResponse
    {
        $request->validate(['nik' => ['required', 'string']]);
        $nik = $request->input('nik');

        $user = User::where('simrs_nik', $nik)->first();
        if (! $user || $emergency_report->user_id !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'Laporan tidak ditemukan atau tidak dapat diakses.',
            ], 404);
        }

        $emergency_report->load('assignedOperator');

        $operator = $emergency_report->assignedOperator;

        return response()->json([
            'success' => true,
            'data' => [
                'report_id' => $emergency_report->report_id,
                'status' => $emergency_report->status,
                'category' => $emergency_report->category,
                'latitude' => (float) $emergency_report->latitude,
                'longitude' => (float) $emergency_report->longitude,
                'address' => $emergency_report->address,
                'created_at' => $emergency_report->created_at->toIso8601String(),
                'responded_at' => $emergency_report->responded_at?->toIso8601String(),
                'response_notes' => $emergency_report->response_notes,
                'operator' => $operator ? [
                    'id' => $operator->id,
                    'name' => $operator->name,
                    'phone' => $operator->phone,
                ] : null,
            ],
        ]);
    }

    /**
     * Daftar riwayat laporan milik NIK (dengan pagination & filter).
     */
    public function index(Request $request): JsonResponse
    {
        $request->validate([
            'nik' => ['required', 'string'],
            'page' => ['nullable', 'integer', 'min:1'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:50'],
            'status' => ['nullable', 'string', Rule::in(EmergencyReport::STATUS_PENDING, EmergencyReport::STATUS_RESPONDED, EmergencyReport::STATUS_IN_PROGRESS, EmergencyReport::STATUS_RESOLVED, EmergencyReport::STATUS_CANCELLED)],
            'category' => ['nullable', 'string', Rule::in(EmergencyReport::CATEGORIES)],
        ]);

        $nik = $request->input('nik');
        $user = User::where('simrs_nik', $nik)->first();

        if (! $user) {
            return response()->json([
                'success' => true,
                'data' => [],
                'meta' => ['current_page' => 1, 'last_page' => 1, 'per_page' => 15, 'total' => 0],
            ]);
        }

        $perPage = (int) $request->input('per_page', 15);
        $query = EmergencyReport::query()
            ->where('user_id', $user->id)
            ->orderByDesc('created_at');

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }
        if ($request->filled('category')) {
            $query->where('category', $request->input('category'));
        }

        $reports = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $reports->map(fn (EmergencyReport $r) => [
                'report_id' => $r->report_id,
                'status' => $r->status,
                'category' => $r->category,
                'address' => $r->address,
                'created_at' => $r->created_at->toIso8601String(),
                'responded_at' => $r->responded_at?->toIso8601String(),
            ]),
            'meta' => [
                'current_page' => $reports->currentPage(),
                'last_page' => $reports->lastPage(),
                'per_page' => $reports->perPage(),
                'total' => $reports->total(),
            ],
        ]);
    }

    /**
     * Batalkan laporan (hanya pemilik, hanya status pending).
     */
    public function cancel(CancelEmergencyReportRequest $request, EmergencyReport $emergency_report): JsonResponse
    {
        $request->validate(['nik' => ['required', 'string']]);
        $nik = $request->input('nik');

        $user = User::where('simrs_nik', $nik)->first();
        if (! $user || $emergency_report->user_id !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'Laporan tidak ditemukan atau tidak dapat diakses.',
            ], 404);
        }

        if ($emergency_report->status !== EmergencyReport::STATUS_PENDING) {
            return response()->json([
                'success' => false,
                'message' => 'Laporan tidak dapat dibatalkan karena sudah direspons operator',
            ], 409);
        }

        $emergency_report->update(['status' => EmergencyReport::STATUS_CANCELLED]);

        return response()->json([
            'success' => true,
            'message' => 'Laporan berhasil dibatalkan',
            'data' => [
                'report_id' => $emergency_report->report_id,
                'status' => $emergency_report->status,
            ],
        ]);
    }

    /**
     * Upload foto kejadian.
     */
    public function uploadPhoto(Request $request, EmergencyReport $emergency_report): JsonResponse
    {
        $request->validate([
            'nik' => ['required', 'string'],
            'photo' => ['required', 'file', 'mimes:jpeg,jpg,png,webp', 'max:5120'],
        ]);

        $nik = $request->input('nik');
        $user = User::where('simrs_nik', $nik)->first();
        if (! $user || $emergency_report->user_id !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'Laporan tidak ditemukan atau tidak dapat diakses.',
            ], 404);
        }

        $file = $request->file('photo');
        $path = $file->store(
            'emergency-reports/'.$emergency_report->report_id,
            'public'
        );

        $emergency_report->update(['photo_path' => $path]);

        $url = Storage::disk('public')->url($path);

        return response()->json([
            'success' => true,
            'data' => [
                'photo_url' => $url,
            ],
        ]);
    }

    /**
     * [OPERATOR] Daftar laporan masuk.
     */
    public function operatorIndex(Request $request): JsonResponse
    {
        $this->authorizeOperator($request);

        $query = EmergencyReport::query()
            ->with('user')
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

        $reports = $query->get();

        return response()->json([
            'success' => true,
            'data' => $reports->map(fn (EmergencyReport $r) => [
                'report_id' => $r->report_id,
                'status' => $r->status,
                'category' => $r->category,
                'latitude' => (float) $r->latitude,
                'longitude' => (float) $r->longitude,
                'address' => $r->address,
                'sender_name' => $r->sender_name,
                'sender_phone' => $r->sender_phone,
                'created_at' => $r->created_at->toIso8601String(),
                'waiting_minutes' => $r->status === EmergencyReport::STATUS_PENDING
                    ? $r->created_at->diffInMinutes(now())
                    : null,
            ]),
        ]);
    }

    /**
     * [OPERATOR] Respons laporan.
     */
    public function operatorRespond(RespondEmergencyReportRequest $request, EmergencyReport $emergency_report): JsonResponse
    {
        $this->authorizeOperator($request);

        $validated = $request->validated();

        $emergency_report->update([
            'status' => $validated['status'],
            'response_notes' => $validated['notes'] ?? $emergency_report->response_notes,
            'assigned_team' => $validated['assigned_team'] ?? $emergency_report->assigned_team,
            'assigned_operator_id' => $emergency_report->assigned_operator_id ?? $request->user()->id,
            'responded_at' => $emergency_report->responded_at ?? now(),
        ]);

        return response()->json([
            'success' => true,
            'data' => [
                'report_id' => $emergency_report->report_id,
                'status' => $emergency_report->status,
                'responded_at' => $emergency_report->responded_at->toIso8601String(),
            ],
        ]);
    }

    private function authorizeOperator(Request $request): void
    {
        $user = $request->user();
        if (! $user->isAdmin() && ! $user->isStaff()) {
            abort(403, 'Hanya operator/admin yang dapat mengakses.');
        }
    }
}
