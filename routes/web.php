<?php

use App\Http\Controllers\DashboardController;
use App\Http\Controllers\EmergencyReportWebController;
use App\Http\Controllers\InventarisBarangController;
use App\Http\Controllers\InventarisController;
use App\Http\Controllers\PegawaiController;
use App\Http\Controllers\SlaReportController;
use App\Http\Controllers\TicketAttachmentController;
use App\Http\Controllers\TicketCollaboratorController;
use App\Http\Controllers\TicketCommentController;
use App\Http\Controllers\TicketController;
use App\Http\Controllers\TicketSparepartItemController;
use App\Http\Controllers\TicketVendorCostController;
use App\Http\Controllers\UserOnlineController;
use App\Http\Controllers\UserPresenceController;
use App\Http\Controllers\UsersController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;

Route::get('/', function () {
    return Inertia::render('welcome', [
        'canRegister' => Features::enabled(Features::registration()),
    ]);
})->name('home');

Route::get('dashboard', DashboardController::class)
    ->middleware(['auth', 'verified'])
    ->name('dashboard');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('users', [UsersController::class, 'index'])->name('users.index');
    Route::get('users/create', [UsersController::class, 'create'])->name('users.create');
    Route::post('users', [UsersController::class, 'store'])->name('users.store');
    Route::get('users/{user}/edit', [UsersController::class, 'edit'])->name('users.edit');
    Route::put('users/{user}', [UsersController::class, 'update'])->name('users.update');
    Route::get('pegawai', [PegawaiController::class, 'index'])->name('pegawai.index');
    Route::get('reports/sla', SlaReportController::class)->name('reports.sla');

    // Laporan Darurat (Emergency / Panic Button) — admin & staff
    Route::get('emergency-reports', [EmergencyReportWebController::class, 'index'])->name('emergency-reports.index');
    Route::get('emergency-reports/create', [EmergencyReportWebController::class, 'create'])->name('emergency-reports.create');
    Route::post('emergency-reports', [EmergencyReportWebController::class, 'store'])->name('emergency-reports.store');
    Route::get('emergency-reports/{emergency_report}', [EmergencyReportWebController::class, 'show'])->name('emergency-reports.show');
    Route::patch('emergency-reports/{emergency_report}/respond', [EmergencyReportWebController::class, 'respond'])->name('emergency-reports.respond');

    // Inventaris CRUD
    Route::resource('inventaris', InventarisController::class)->parameters(['inventaris' => 'inventaris:no_inventaris']);

    // Inventaris Barang CRUD (Master Barang)
    Route::resource('inventaris-barang', InventarisBarangController::class)->parameters(['inventaris_barang' => 'barang:kode_barang']);

    // Ticket routes
    Route::get('tickets/search-for-link', [TicketController::class, 'searchForLink'])->name('tickets.search-for-link');
    Route::get('tickets/search-for-inventaris', [TicketController::class, 'searchForInventaris'])->name('tickets.search-for-inventaris');
    Route::get('tickets/search-for-user', [TicketController::class, 'searchForUser'])->name('tickets.search-for-user');
    Route::get('tickets/export', [TicketController::class, 'export'])->name('tickets.export');
    Route::resource('tickets', TicketController::class);
    Route::post('tickets/{ticket}/assign-self', [TicketController::class, 'assignToSelf'])->name('tickets.assign-self');
    Route::post('tickets/{ticket}/close', [TicketController::class, 'close'])->name('tickets.close');
    Route::post('tickets/{ticket}/confirm', [TicketController::class, 'confirm'])->name('tickets.confirm');
    Route::post('tickets/{ticket}/complain', [TicketController::class, 'complain'])->name('tickets.complain');

    // Ticket comments
    Route::post('tickets/{ticket}/comments', [TicketCommentController::class, 'store'])->name('tickets.comments.store');
    Route::delete('tickets/{ticket}/comments/{comment}', [TicketCommentController::class, 'destroy'])->name('tickets.comments.destroy');

    // Ticket attachments
    Route::post('tickets/{ticket}/attachments', [TicketAttachmentController::class, 'store'])->name('tickets.attachments.store');
    Route::delete('tickets/{ticket}/attachments/{attachment}', [TicketAttachmentController::class, 'destroy'])->name('tickets.attachments.destroy');

    // Ticket collaborators (rekan)
    Route::post('tickets/{ticket}/collaborators', [TicketCollaboratorController::class, 'store'])->name('tickets.collaborators.store');
    Route::delete('tickets/{ticket}/collaborators/{collaborator}', [TicketCollaboratorController::class, 'destroy'])->name('tickets.collaborators.destroy');

    // Ticket vendor costs
    Route::post('tickets/{ticket}/vendor-costs', [TicketVendorCostController::class, 'store'])->name('tickets.vendor-costs.store');
    Route::patch('tickets/{ticket}/vendor-costs/{vendorCost}', [TicketVendorCostController::class, 'update'])->name('tickets.vendor-costs.update');
    Route::delete('tickets/{ticket}/vendor-costs/{vendorCost}', [TicketVendorCostController::class, 'destroy'])->name('tickets.vendor-costs.destroy');

    // Ticket spare part (perbaikan sendiri)
    Route::post('tickets/{ticket}/sparepart-items', [TicketSparepartItemController::class, 'store'])->name('tickets.sparepart-items.store');
    Route::patch('tickets/{ticket}/sparepart-items/{sparepartItem}', [TicketSparepartItemController::class, 'update'])->name('tickets.sparepart-items.update');
    Route::delete('tickets/{ticket}/sparepart-items/{sparepartItem}', [TicketSparepartItemController::class, 'destroy'])->name('tickets.sparepart-items.destroy');

    // User Presence API
    Route::get('api/users/online', [UserPresenceController::class, 'index'])->name('api.users.online');
    Route::get('api/users/online/count', [UserPresenceController::class, 'count'])->name('api.users.online.count');
    Route::get('api/users/{user}/online', [UserPresenceController::class, 'check'])->name('api.users.online.check');

    // User Online Page
    Route::get('users/online', [UserOnlineController::class, 'index'])->name('users.online');
    Route::get('api/users-online', [UserOnlineController::class, 'api'])->name('api.users-online');
});

require __DIR__.'/settings.php';
