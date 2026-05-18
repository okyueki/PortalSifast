<?php

namespace App\Http\Controllers\Api;

use App\Events\EmergencyReportCreated;
use App\Events\EmergencyReportStatusChanged;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\CancelEmergencyReportRequest;
use App\Http\Requests\Api\RespondEmergencyReportRequest;
use App\Http\Requests\Api\StoreEmergencyReportRequest;
use App\Jobs\SendPanicFcmJob;
use App\Models\EmergencyReport;
use App\Models\User;
use App\Services\EmergencyFcmService;
use App\Services\ResolveUserByNikService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

class EmergencyReportController extends Controller
{
    public function __construct(
        private ResolveUserByNikService $resolveUserByNik,
        private EmergencyFcmService $fcmService
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

        // Broadcast ke SEMUA staff via Queue (dengan retry 3x)
        // Tidak blocking response - queue async
        SendPanicFcmJob::dispatch($report)->onQueue('fcm');

        // Broadcast to Command Center via WebSocket (sync - perlu real-time)
        EmergencyReportCreated::dispatch($report);

        return response()->json([
            'success' => true,
            'message' => 'Laporan berhasil diterima',
            'data' => [
                'report_id' => $report->report_id,
                'status' => $report->status,
                'created_at' => $report->created_at->toIso8601String(),
                // Info untuk frontend: semua staff dapat notifikasi
                // Staff yang mau ambil tugas klik ACCEPT dari app
                'accepted_by' => null, // akan di-set saat ada yang accept
            ],
        ], 201);
    }

    /**
     * Cek status laporan (hanya pemilik by NIK).
     */
    public function show(Request $request, EmergencyReport $emergency_report): JsonResponse
    {
        $validation = $this->validateNik($request);
        if ($validation instanceof JsonResponse) {
            return $validation;
        }
        $nik = $validation;

        $user = User::where('simrs_nik', $nik)->first();
        if (! $user || $emergency_report->user_id !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'Laporan tidak ditemukan atau tidak dapat diakses.',
                'error_code' => 'REPORT_NOT_FOUND',
            ], 404);
        }

        $emergency_report->load('assignedOperator');

        $operator = $emergency_report->assignedOperator;

        $senderNik = $user->simrs_nik;
        $respondedByName = $operator?->name;

        return response()->json([
            'success' => true,
            'data' => [
                'report_id' => $emergency_report->report_id,
                'sender_nik' => $senderNik,
                'sender_name' => $emergency_report->sender_name,
                'category' => $emergency_report->category,
                'notes' => $emergency_report->notes,
                'status' => $emergency_report->status,
                'latitude' => (float) $emergency_report->latitude,
                'longitude' => (float) $emergency_report->longitude,
                'address' => $emergency_report->address,
                'created_at' => $emergency_report->created_at->toIso8601String(),
                'responded_at' => $emergency_report->responded_at?->toIso8601String(),
                'responded_by_name' => $respondedByName,
                'arrived_at' => $emergency_report->arrived_at?->toIso8601String(),
                'resolved_at' => $emergency_report->resolved_at?->toIso8601String(),
                'destination_type' => $emergency_report->destination_type,
                'destination_name' => $emergency_report->destination_name,
                'operator' => $operator ? [
                    'id' => $operator->id,
                    'name' => $operator->name,
                    'phone' => $operator->phone,
                ] : null,
            ],
        ]);
    }

    /**
     * Get lokasi petugas untuk korban (polling). Hanya pemilik laporan (NIK) yang boleh akses.
     */
    public function officerLocation(Request $request, EmergencyReport $emergency_report): JsonResponse
    {
        $validation = $this->validateNik($request);
        if ($validation instanceof JsonResponse) {
            return $validation;
        }
        $nik = $validation;

        $user = User::where('simrs_nik', $nik)->first();
        if (! $user || $emergency_report->user_id !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'Laporan tidak ditemukan atau tidak dapat diakses.',
                'error_code' => 'REPORT_NOT_FOUND',
            ], 404);
        }

        $emergency_report->load('assignedOperator');
        $operator = $emergency_report->assignedOperator;
        $latestLocation = $emergency_report->officerLocations()->latest()->first();

        $locationData = null;
        $etaMinutes = null;
        $distanceMeters = null;
        if ($latestLocation) {
            $locationData = [
                'latitude' => (float) $latestLocation->latitude,
                'longitude' => (float) $latestLocation->longitude,
                'updated_at' => $latestLocation->updated_at->toIso8601String(),
            ];
            $etaMinutes = $latestLocation->eta_minutes;
            $distanceMeters = $latestLocation->distance_meters;
        }

        return response()->json([
            'success' => true,
            'data' => [
                'officer' => $operator ? [
                    'id' => $operator->id,
                    'name' => $operator->name,
                    'simrs_nik' => $operator->simrs_nik,
                    'dep_id' => $operator->dep_id,
                    'phone' => $operator->phone,
                ] : null,
                'location' => $locationData,
                'eta_minutes' => $etaMinutes,
                'distance_meters' => $distanceMeters,
                'status' => $emergency_report->status,
            ],
        ]);
    }

    /**
     * Daftar riwayat laporan milik NIK (dengan pagination & filter).
     */
    public function index(Request $request): JsonResponse
    {
        $validation = $this->validateNik($request);
        if ($validation instanceof JsonResponse) {
            return $validation;
        }
        $nik = $validation;

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
        $validation = $this->validateNik($request);
        if ($validation instanceof JsonResponse) {
            return $validation;
        }
        $nik = $validation;

        $user = User::where('simrs_nik', $nik)->first();
        if (! $user || $emergency_report->user_id !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'Laporan tidak ditemukan atau tidak dapat diakses.',
                'error_code' => 'REPORT_NOT_FOUND',
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
            'photo' => ['required', 'file', 'mimes:jpeg,jpg,png,webp', 'max:5120'],
        ]);

        $validation = $this->validateNik($request);
        if ($validation instanceof JsonResponse) {
            return $validation;
        }
        $nik = $validation;

        $user = User::where('simrs_nik', $nik)->first();
        if (! $user || $emergency_report->user_id !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'Laporan tidak ditemukan atau tidak dapat diakses.',
                'error_code' => 'REPORT_NOT_FOUND',
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

        $validStatuses = [
            EmergencyReport::STATUS_PENDING,
            EmergencyReport::STATUS_RESPONDED,
            EmergencyReport::STATUS_IN_PROGRESS,
            EmergencyReport::STATUS_ARRIVED,
            EmergencyReport::STATUS_RESOLVED,
        ];

        $request->validate([
            'status' => ['nullable', 'string', function ($attribute, $value, $fail) use ($validStatuses) {
                $values = array_filter(array_map('trim', explode(',', $value)));
                foreach ($values as $v) {
                    if (! in_array($v, $validStatuses)) {
                        $fail("Status '{$v}' tidak valid. Valid: " . implode(', ', $validStatuses));
                    }
                }
            }],
            'page' => ['nullable', 'integer', 'min:1'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:50'],
        ]);

        $perPage = (int) $request->input('per_page', 20);
        $query = EmergencyReport::query()
            ->with('user', 'assignedOperator')
            ->orderByDesc('created_at');

        if ($request->filled('status')) {
            $statusValues = array_filter(array_map('trim', explode(',', $request->input('status'))));
            if (count($statusValues) > 1) {
                $query->whereIn('status', $statusValues);
            } else {
                $query->where('status', $statusValues[0]);
            }
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

        $reports = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $reports->map(fn (EmergencyReport $r) => $this->formatReportForOperator($r)),
            'meta' => [
                'current_page' => $reports->currentPage(),
                'last_page' => $reports->lastPage(),
                'per_page' => $reports->perPage(),
                'total' => $reports->total(),
            ],
        ]);
    }

    /**
     * Format satu laporan untuk response operator (list & detail).
     *
     * @return array<string, mixed>
     */
    private function formatReportForOperator(EmergencyReport $r): array
    {
        $operator = $r->assignedOperator;

        return [
            'report_id' => $r->report_id,
            'status' => $r->status,
            'category' => $r->category,
            'latitude' => (float) $r->latitude,
            'longitude' => (float) $r->longitude,
            'address' => $r->address,
            'sender_name' => $r->sender_name,
            'sender_phone' => $r->sender_phone,
            'notes' => $r->notes,
            'created_at' => $r->created_at->toIso8601String(),
            'responded_at' => $r->responded_at?->toIso8601String(),
            'resolved_at' => $r->resolved_at?->toIso8601String(),
            'response_notes' => $r->response_notes,
            'assigned_team' => $r->assigned_team,
            'waiting_minutes' => $r->status === EmergencyReport::STATUS_PENDING
                ? $r->created_at->diffInMinutes(now())
                : null,
            'assigned_operator' => $operator ? [
                'id' => $operator->id,
                'name' => $operator->name,
                'phone' => $operator->phone,
            ] : null,
            'destination_type' => $r->destination_type ?? null,
            'destination_name' => $r->destination_name ?? null,
        ];
    }

    /**
     * [OPERATOR] Detail satu laporan (untuk refetch by ID tanpa load seluruh list).
     */
    public function operatorShow(Request $request, EmergencyReport $emergency_report): JsonResponse
    {
        $this->authorizeOperator($request);

        $emergency_report->load('assignedOperator', 'user');

        return response()->json([
            'success' => true,
            'data' => $this->formatReportForOperator($emergency_report),
        ]);
    }

    /**
     * [OPERATOR] Respons laporan.
     */
    public function operatorRespond(RespondEmergencyReportRequest $request, EmergencyReport $emergency_report): JsonResponse
    {
        $this->authorizeOperator($request);

        $validated = $request->validated();

        $payload = [
            'status' => $validated['status'],
            'response_notes' => $validated['notes'] ?? $emergency_report->response_notes,
            'assigned_team' => $validated['assigned_team'] ?? $emergency_report->assigned_team,
            'assigned_operator_id' => $emergency_report->assigned_operator_id ?? $request->user()->id,
            'responded_at' => $emergency_report->responded_at ?? now(),
        ];
        if ($validated['status'] === EmergencyReport::STATUS_ARRIVED) {
            $payload['arrived_at'] = $emergency_report->arrived_at ?? now();
        }
        if ($validated['status'] === EmergencyReport::STATUS_RESOLVED) {
            $payload['resolved_at'] = $emergency_report->resolved_at ?? now();
            if (array_key_exists('destination_type', $validated)) {
                $payload['destination_type'] = $validated['destination_type'];
            }
            if (array_key_exists('destination_name', $validated)) {
                $payload['destination_name'] = $validated['destination_name'];
            }
        } elseif ($validated['status'] !== EmergencyReport::STATUS_ARRIVED) {
            $payload['destination_type'] = null;
            $payload['destination_name'] = null;
            $payload['arrived_at'] = null;
        }
        $emergency_report->update($payload);
        $this->fcmService->notifyReportOwnerStatusUpdated($emergency_report, $validated['status']);

        // Broadcast status change to Command Center via WebSocket
        $previousStatus = $emergency_report->getOriginal('status') ?? $emergency_report->status;
        EmergencyReportStatusChanged::dispatch(
            $emergency_report->fresh(),
            $previousStatus,
            $request->user()->name
        );

        return response()->json([
            'success' => true,
            'data' => [
                'report_id' => $emergency_report->report_id,
                'status' => $emergency_report->status,
                'responded_at' => $emergency_report->responded_at->toIso8601String(),
            ],
        ]);
    }

    /**
     * Staff mobile: Accept tugas panic.
     * Staff yang menerima notifikasi bisa decide untuk ambil tugas.
     *
     * Menggunakan pessimistic locking untuk mencegah race condition
     * saat 2 staff accept bersamaan.
     */
    public function acceptReport(Request $request, EmergencyReport $emergency_report): JsonResponse
    {
        $user = $request->user();

        try {
            // Gunakan transaction dengan pessimistic locking
            $updated = \Illuminate\Support\Facades\DB::transaction(function () use ($emergency_report, $user) {
                // Lock row untuk dicek dan update - mencegah race condition
                $report = EmergencyReport::where('id', $emergency_report->id)
                    ->lockForUpdate()
                    ->first();

                // Validasi: laporan masih pending (belum diambil orang lain)
                if ($report->status !== EmergencyReport::STATUS_PENDING) {
                    // Jika sudah di-assign ke orang lain
                    if ($report->assigned_operator_id) {
                        throw new \App\Exceptions\PanicAlreadyTakenException(
                            'Laporan sudah diambil oleh petugas lain: '.$report->assignedOperator?->name
                        );
                    }
                    // Jika status sudah berubah
                    throw new \App\Exceptions\PanicStatusInvalidException(
                        'Laporan tidak bisa di-accept (status: '.$report->status.')'
                    );
                }

                // Update dengan data yang sudah di-lock
                $report->update([
                    'assigned_operator_id' => $user->id,
                    'status' => EmergencyReport::STATUS_RESPONDED,
                    'responded_at' => now(),
                ]);

                return $report->fresh();
            });

            // Notify pelapor bahwa sudah ada yang accept
            $this->fcmService->notifyReportOwnerStatusUpdated($updated, 'responded');

            // Broadcast status change
            EmergencyReportStatusChanged::dispatch(
                $updated,
                EmergencyReport::STATUS_PENDING,
                $user->name
            );

            // Log audit
            \App\Models\PanicAuditLog::create([
                'report_id' => $updated->id,
                'user_id' => $user->id,
                'action' => 'accept',
                'data' => [
                    'officer_name' => $user->name,
                    'previous_status' => EmergencyReport::STATUS_PENDING,
                    'new_status' => EmergencyReport::STATUS_RESPONDED,
                ],
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Tugas panic berhasil di-accept',
                'data' => [
                    'report_id' => $updated->report_id,
                    'status' => $updated->status,
                    'responded_at' => $updated->responded_at->toIso8601String(),
                    'assigned_officer' => [
                        'id' => $user->id,
                        'name' => $user->name,
                        'phone' => $user->phone,
                    ],
                    'start_tracking_url' => '/api/sifast/officer/location',
                ],
            ]);
        } catch (\App\Exceptions\PanicAlreadyTakenException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'error_code' => 'ALREADY_TAKEN',
            ], 409);
        } catch (\App\Exceptions\PanicStatusInvalidException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'error_code' => 'STATUS_INVALID',
            ], 422);
        }
    }

    private function authorizeOperator(Request $request): void
    {
        $user = $request->user();
        if (! $user->isAdmin() && ! $user->isStaff()) {
            abort(403, 'Hanya operator/admin yang dapat mengakses.');
        }
    }

    /**
     * Validasi format NIK - minimal 6 karakter.
     *
     * @return string|JsonResponse NIK valid atau response error
     */
    private function validateNik(Request $request): string|JsonResponse
    {
        $request->validate(['nik' => ['required', 'string']]);
        $nik = $request->input('nik');

        if (! is_string($nik)) {
            return response()->json([
                'success' => false,
                'message' => 'NIK harus berupa teks.',
                'error_code' => 'INVALID_NIK',
            ], 400);
        }

        if (strlen(trim($nik)) < 6) {
            return response()->json([
                'success' => false,
                'message' => 'NIK tidak valid. NIK minimal 6 karakter.',
                'error_code' => 'INVALID_NIK',
            ], 400);
        }

        return $nik;
    }
}
