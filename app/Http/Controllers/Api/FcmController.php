<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\FcmDeviceToken;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class FcmController extends Controller
{
    /**
     * Registrasi FCM device token (untuk push notification).
     * Frontend panggil setelah login; backend menyimpan token terkait user yang login.
     * Jika token sudah ada untuk user ini, di-update (platform dll.).
     */
    public function register(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'token' => ['required', 'string', 'max:500'],
            'platform' => ['nullable', 'string', 'max:20', Rule::in(['android', 'ios', 'web'])],
        ]);

        $user = $request->user();
        if (! $user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthenticated.',
            ], 401);
        }

        FcmDeviceToken::query()->updateOrCreate(
            [
                'user_id' => $user->id,
                'token' => $validated['token'],
            ],
            [
                'platform' => $validated['platform'] ?? null,
            ]
        );

        return response()->json([
            'success' => true,
            'message' => 'Device token berhasil didaftarkan.',
        ]);
    }
}
