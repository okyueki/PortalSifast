<?php

use App\Http\Controllers\Settings\PasswordController;
use App\Http\Controllers\Settings\ProfileController;
use App\Http\Controllers\Settings\SyncUsersController;
use App\Http\Controllers\Settings\TicketSettingsController;
use App\Http\Controllers\Settings\TwoFactorAuthenticationController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::middleware(['auth'])->group(function () {
    Route::redirect('settings', '/settings/profile');

    Route::get('settings/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('settings/profile', [ProfileController::class, 'update'])->name('profile.update');

    Route::get('settings/sync-users', [SyncUsersController::class, 'show'])->name('sync-users.show');
    Route::post('settings/sync-users', [SyncUsersController::class, 'store'])->name('sync-users.store');
});

Route::middleware(['auth', 'verified'])->group(function () {
    Route::delete('settings/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    Route::get('settings/password', [PasswordController::class, 'edit'])->name('user-password.edit');

    Route::put('settings/password', [PasswordController::class, 'update'])
        ->middleware('throttle:6,1')
        ->name('user-password.update');

    Route::get('settings/appearance', function () {
        return Inertia::render('settings/appearance');
    })->name('appearance.edit');

    Route::get('settings/websocket-status', function () {
        return Inertia::render('settings/websocket-status');
    })->name('settings.websocket-status');

    Route::get('settings/two-factor', [TwoFactorAuthenticationController::class, 'show'])
        ->name('two-factor.show');

    // Ticket Settings (Master Data)
    Route::get('settings/tickets', [TicketSettingsController::class, 'index'])->name('settings.tickets');

    // Ticket Types
    Route::post('settings/ticket-types', [TicketSettingsController::class, 'storeType'])->name('settings.ticket-types.store');
    Route::put('settings/ticket-types/{type}', [TicketSettingsController::class, 'updateType'])->name('settings.ticket-types.update');
    Route::delete('settings/ticket-types/{type}', [TicketSettingsController::class, 'destroyType'])->name('settings.ticket-types.destroy');

    // Ticket Categories
    Route::post('settings/ticket-categories', [TicketSettingsController::class, 'storeCategory'])->name('settings.ticket-categories.store');
    Route::put('settings/ticket-categories/{category}', [TicketSettingsController::class, 'updateCategory'])->name('settings.ticket-categories.update');
    Route::delete('settings/ticket-categories/{category}', [TicketSettingsController::class, 'destroyCategory'])->name('settings.ticket-categories.destroy');

    // Ticket Priorities
    Route::post('settings/ticket-priorities', [TicketSettingsController::class, 'storePriority'])->name('settings.ticket-priorities.store');
    Route::put('settings/ticket-priorities/{priority}', [TicketSettingsController::class, 'updatePriority'])->name('settings.ticket-priorities.update');
    Route::delete('settings/ticket-priorities/{priority}', [TicketSettingsController::class, 'destroyPriority'])->name('settings.ticket-priorities.destroy');

    // Ticket Statuses
    Route::post('settings/ticket-statuses', [TicketSettingsController::class, 'storeStatus'])->name('settings.ticket-statuses.store');
    Route::put('settings/ticket-statuses/{status}', [TicketSettingsController::class, 'updateStatus'])->name('settings.ticket-statuses.update');
    Route::delete('settings/ticket-statuses/{status}', [TicketSettingsController::class, 'destroyStatus'])->name('settings.ticket-statuses.destroy');

    // Ticket Tags
    Route::post('settings/ticket-tags', [TicketSettingsController::class, 'storeTag'])->name('settings.ticket-tags.store');
    Route::put('settings/ticket-tags/{tag}', [TicketSettingsController::class, 'updateTag'])->name('settings.ticket-tags.update');
    Route::delete('settings/ticket-tags/{tag}', [TicketSettingsController::class, 'destroyTag'])->name('settings.ticket-tags.destroy');
});
