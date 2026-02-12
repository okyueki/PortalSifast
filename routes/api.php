<?php

use App\Http\Controllers\Api\ApiTicketController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes untuk Integrasi Sistem Kepegawaian
|--------------------------------------------------------------------------
|
| Endpoint ini digunakan oleh aplikasi kepegawaian untuk membuat dan
| melihat tiket tanpa user perlu login ke PortalSifast.
|
| Autentikasi: Sanctum Bearer Token
| Cara generate token: php artisan tinker
|   $user = User::where('email', 'api-service@portal.local')->firstOrCreate([...]);
|   $token = $user->createToken('kepegawaian-app')->plainTextToken;
|
*/

Route::middleware('auth:sanctum')->group(function () {
    // Buat tiket baru (identifikasi pelapor pakai NIK)
    Route::post('/tickets', [ApiTicketController::class, 'store']);

    // Daftar tiket milik NIK tertentu
    Route::get('/tickets', [ApiTicketController::class, 'index']);

    // Detail tiket (hanya jika requester sesuai NIK)
    Route::get('/tickets/{ticket}', [ApiTicketController::class, 'show']);

    // Tambah komentar pada tiket (hanya requester sesuai NIK)
    Route::post('/tickets/{ticket}/comments', [ApiTicketController::class, 'storeComment']);
});

// Test endpoint (tanpa auth) untuk cek API berjalan
Route::get('/health', function () {
    return response()->json([
        'status' => 'ok',
        'message' => 'API PortalSifast Ticketing',
        'version' => '1.0',
    ]);
});
