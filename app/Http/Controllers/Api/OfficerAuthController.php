<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\OfficerLoginRequest;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;

class OfficerAuthController extends Controller
{
    /**
     * Login petugas emergency (NIK atau badge_id + password).
     * Mengembalikan Sanctum token untuk akses endpoint officer.
     */
    public function login(OfficerLoginRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $user = null;
        if (! empty($validated['nik'])) {
            $user = User::where('simrs_nik', $validated['nik'])->first();
        } else {
            $user = User::where('badge_id', $validated['badge_id'])->first();
        }

        if (! $user || ! Hash::check($validated['password'], $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'NIK/badge atau password salah.',
            ], 401);
        }

        if (! $user->isOfficer()) {
            return response()->json([
                'success' => false,
                'message' => 'User ini bukan petugas emergency.',
            ], 403);
        }

        $token = $user->createToken('officer-app')->plainTextToken;

        return response()->json([
            'success' => true,
            'data' => [
                'token' => $token,
                'officer' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'simrs_nik' => $user->simrs_nik,
                    'dep_id' => $user->dep_id,
                    'phone' => $user->phone,
                ],
            ],
        ]);
    }
}
