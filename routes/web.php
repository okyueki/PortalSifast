<?php

use App\Http\Controllers\ChatController;
use App\Http\Controllers\DailyActivityReportController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DepartmentReportController;
use App\Http\Controllers\DepartmentReportPrintController;
use App\Http\Controllers\EmergencyReportWebController;
use App\Http\Controllers\EmployeeSalaryWebImportController;
use App\Http\Controllers\InventarisBarangController;
use App\Http\Controllers\InventarisController;
use App\Http\Controllers\PegawaiController;
use App\Http\Controllers\ProjectController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\RequesterReportController;
use App\Http\Controllers\SlaReportController;
use App\Http\Controllers\TechnicianReportController;
use App\Http\Controllers\TechnicianReportPrintController;
use App\Http\Controllers\TicketAttachmentController;
use App\Http\Controllers\TicketCollaboratorController;
use App\Http\Controllers\TicketCommentController;
use App\Http\Controllers\TicketController;
use App\Http\Controllers\TicketIssueController;
use App\Http\Controllers\TicketSparepartItemController;
use App\Http\Controllers\TicketStatusController;
use App\Http\Controllers\TicketVendorCostController;
use App\Http\Controllers\UserOnlineController;
use App\Http\Controllers\UserPresenceController;
use App\Http\Controllers\UsersController;
use App\Http\Controllers\WorkNoteController;
use Illuminate\Support\Facades\Broadcast;
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

// Broadcast auth untuk private channel (chat)
Broadcast::routes(['middleware' => ['web', 'auth']]);

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('users', [UsersController::class, 'index'])->name('users.index');
    Route::get('users/create', [UsersController::class, 'create'])->name('users.create');
    Route::post('users', [UsersController::class, 'store'])->name('users.store');
    Route::get('users/{user}/edit', [UsersController::class, 'edit'])->name('users.edit');
    Route::put('users/{user}', [UsersController::class, 'update'])->name('users.update');
    Route::get('pegawai', [PegawaiController::class, 'index'])->name('pegawai.index');
    Route::get('reports', [ReportController::class, 'index'])->name('reports.index');
    Route::get('reports/sla', SlaReportController::class)->name('reports.sla');
    Route::get('reports/department', DepartmentReportController::class)->name('reports.department');
    Route::get('reports/department/print', DepartmentReportPrintController::class)->name('reports.department.print');
    Route::get('reports/requesters', RequesterReportController::class)->name('reports.requesters');
    Route::get('reports/daily-activity', DailyActivityReportController::class)->name('reports.daily-activity');
    Route::get('reports/technician', TechnicianReportController::class)->name('reports.technician');
    Route::get('reports/technician/print', TechnicianReportPrintController::class)->name('reports.technician.print');

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

    // Rencana / Project (tracking per project)
    Route::resource('projects', ProjectController::class);

    // Ticket routes (board + statuses must be before resource so not caught as ticket id)
    Route::get('tickets/board', [TicketController::class, 'board'])->name('tickets.board');
    Route::get('tickets/statuses', [TicketStatusController::class, 'index'])->name('tickets.statuses.index');
    Route::get('tickets/search-for-link', [TicketController::class, 'searchForLink'])->name('tickets.search-for-link');
    Route::get('tickets/search-for-inventaris', [TicketController::class, 'searchForInventaris'])->name('tickets.search-for-inventaris');
    Route::get('tickets/search-for-user', [TicketController::class, 'searchForUser'])->name('tickets.search-for-user');
    Route::get('tickets/export', [TicketController::class, 'export'])->name('tickets.export');
    Route::get('tickets/import', [TicketController::class, 'importForm'])->name('tickets.import');
    Route::get('tickets/import/template', [TicketController::class, 'importTemplate'])->name('tickets.import.template');
    Route::post('tickets/import', [TicketController::class, 'import'])->name('tickets.import.store');
    Route::resource('tickets', TicketController::class);
    Route::post('tickets/{ticket}/assign-self', [TicketController::class, 'assignToSelf'])->name('tickets.assign-self');
    Route::post('tickets/{ticket}/close', [TicketController::class, 'close'])->name('tickets.close');
    Route::post('tickets/{ticket}/resolve', [TicketController::class, 'resolve'])->name('tickets.resolve');
    Route::post('tickets/{ticket}/confirm', [TicketController::class, 'confirm'])->name('tickets.confirm');
    Route::post('tickets/{ticket}/complain', [TicketController::class, 'complain'])->name('tickets.complain');
    Route::post('tickets/{ticket}/publish', [TicketController::class, 'publish'])->name('tickets.publish');

    // Ticket issues
    Route::post('tickets/{ticket}/issues', [TicketIssueController::class, 'store'])->name('tickets.issues.store');
    Route::patch('tickets/{ticket}/issues/{issue}/resolve', [TicketIssueController::class, 'resolve'])->name('tickets.issues.resolve');

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

    // Catatan Kerja (work notes)
    Route::get('catatan', [WorkNoteController::class, 'index'])->name('catatan.index');
    Route::post('catatan', [WorkNoteController::class, 'store'])->name('catatan.store');
    Route::patch('catatan/{workNote}', [WorkNoteController::class, 'update'])->name('catatan.update');
    Route::delete('catatan/{workNote}', [WorkNoteController::class, 'destroy'])->name('catatan.destroy');

    // Chat
    Route::get('chat', [ChatController::class, 'index'])->name('chat.index');
    Route::post('chat', [ChatController::class, 'store'])->name('chat.store');
    Route::get('chat/{conversation}', [ChatController::class, 'show'])->name('chat.show');
    Route::post('chat/{conversation}/messages', [ChatController::class, 'storeMessage'])->name('chat.messages.store');

    // Payroll / Gaji Karyawan
    Route::get('payroll', [EmployeeSalaryWebImportController::class, 'index'])->name('payroll.index');
    Route::get('payroll/dashboard', [EmployeeSalaryWebImportController::class, 'dashboard'])->name('payroll.dashboard');
    Route::get('payroll/import', [EmployeeSalaryWebImportController::class, 'create'])->name('payroll.import');
    Route::post('payroll/import', [EmployeeSalaryWebImportController::class, 'store'])->name('payroll.import.store');
    Route::get('payroll/import-history', [EmployeeSalaryWebImportController::class, 'importHistory'])->name('payroll.import-history');
    Route::get('payroll/audit-logs', [EmployeeSalaryWebImportController::class, 'auditLogs'])->name('payroll.audit-logs');
    Route::post('payroll/import/{payrollImport}/rollback', [EmployeeSalaryWebImportController::class, 'rollbackImport'])->name('payroll.rollback');
    Route::post('payroll/import/{payrollImport}/approve', [EmployeeSalaryWebImportController::class, 'approveImport'])->name('payroll.approve');
    Route::post('payroll/import/{payrollImport}/reject', [EmployeeSalaryWebImportController::class, 'rejectImport'])->name('payroll.reject');
    Route::post('payroll/bulk-delete', [EmployeeSalaryWebImportController::class, 'bulkDestroy'])->name('payroll.bulk-destroy');
    Route::post('payroll/bulk-email', [EmployeeSalaryWebImportController::class, 'sendBulkEmail'])->name('payroll.bulk-email');
    Route::post('payroll/{employeeSalary}/send-email', [EmployeeSalaryWebImportController::class, 'sendEmail'])->name('payroll.send-email');
    Route::get('payroll/employee/{nik}', [EmployeeSalaryWebImportController::class, 'employeeHistory'])->name('payroll.employee-history');
    Route::get('payroll/{employeeSalary}', [EmployeeSalaryWebImportController::class, 'show'])->name('payroll.show');
    Route::get('payroll/{employeeSalary}/print', [EmployeeSalaryWebImportController::class, 'print'])->name('payroll.print');
    Route::patch('payroll/{employeeSalary}', [EmployeeSalaryWebImportController::class, 'update'])->name('payroll.update');
    Route::delete('payroll/{employeeSalary}', [EmployeeSalaryWebImportController::class, 'destroy'])->name('payroll.destroy');
});

require __DIR__.'/settings.php';
