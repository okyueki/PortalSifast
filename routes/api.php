<?php

use App\Http\Controllers\Api\ApiTicketController;
use App\Http\Controllers\Api\EmergencyReportController;
use App\Http\Controllers\Api\OfficerAuthController;
use App\Http\Controllers\Api\OfficerLocationController;
use App\Models\TicketCategory;
use App\Models\TicketPriority;
use App\Models\TicketStatus;
use App\Models\TicketType;
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
    // Data user by NIK (nama, email, dll.) — untuk tampil "login as" di aplikasi kepegawaian
    Route::get('/user', [ApiTicketController::class, 'userByNik']);

    // Buat tiket baru (identifikasi pelapor pakai NIK)
    Route::post('/tickets', [ApiTicketController::class, 'store']);

    // Daftar tiket milik NIK tertentu
    Route::get('/tickets', [ApiTicketController::class, 'index']);

    // Detail tiket (hanya jika requester sesuai NIK)
    Route::get('/tickets/{ticket}', [ApiTicketController::class, 'show']);

    // Tambah komentar pada tiket (hanya requester sesuai NIK)
    Route::post('/tickets/{ticket}/comments', [ApiTicketController::class, 'storeComment']);

    // =====================================================================
    // Endpoint untuk Frontend Kepegawaian (prefix: /api/sifast/)
    // =====================================================================
    Route::prefix('sifast')->group(function () {
        // Data user by NIK (nama, email, dll.)
        Route::get('/user', [ApiTicketController::class, 'userByNik']);

        // Tiket (dengan pagination)
        Route::get('/ticket', [ApiTicketController::class, 'indexPaginated']);
        Route::post('/ticket', [ApiTicketController::class, 'store']);
        Route::get('/ticket/{ticket}', [ApiTicketController::class, 'show']);
        Route::post('/ticket/{ticket}/comments', [ApiTicketController::class, 'storeComment']);

        // Master Data
        Route::get('/ticket-type', fn () => response()->json(
            TicketType::active()->get(['id', 'name', 'slug', 'description'])
        ));
        Route::get('/ticket-category', fn () => response()->json(
            TicketCategory::active()->with('subcategories:id,name,ticket_category_id,is_active')->get(['id', 'name', 'dep_id', 'ticket_type_id', 'is_development'])
        ));
        Route::get('/ticket-priority', fn () => response()->json(
            TicketPriority::active()->ordered()->get(['id', 'name', 'level', 'color', 'response_hours', 'resolution_hours'])
        ));
        Route::get('/ticket-status', fn () => response()->json(
            TicketStatus::active()->ordered()->get(['id', 'name', 'slug', 'color', 'order', 'is_closed'])
        ));

        // Emergency / Panic Button
        Route::prefix('emergency')->group(function () {
            Route::post('/reports', [EmergencyReportController::class, 'store']);
            Route::get('/reports', [EmergencyReportController::class, 'index']);
            Route::get('/reports/{emergency_report}', [EmergencyReportController::class, 'show']);
            Route::get('/reports/{emergency_report}/officer-location', [EmergencyReportController::class, 'officerLocation']);
            Route::patch('/reports/{emergency_report}/cancel', [EmergencyReportController::class, 'cancel']);
            Route::post('/reports/{emergency_report}/photo', [EmergencyReportController::class, 'uploadPhoto']);
            Route::get('/operator/reports', [EmergencyReportController::class, 'operatorIndex']);
            Route::patch('/operator/reports/{emergency_report}/respond', [EmergencyReportController::class, 'operatorRespond']);
        });

        // Officer Tracking (petugas emergency) — butuh token dari login officer
        Route::prefix('officer')->middleware('officer')->group(function () {
            Route::post('/location', [OfficerLocationController::class, 'store']);
        });
    });
});

// Officer login (tanpa auth — mengembalikan token)
Route::post('/sifast/officer/auth/login', [OfficerAuthController::class, 'login']);

// Test endpoint (tanpa auth) untuk cek API berjalan
Route::get('/health', function () {
    return response()->json([
        'status' => 'ok',
        'message' => 'API PortalSifast Ticketing',
        'version' => '1.0',
    ]);
});
