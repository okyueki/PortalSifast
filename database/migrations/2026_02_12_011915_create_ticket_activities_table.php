<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('ticket_activities', function (Blueprint $table) {
            $table->id();
            $table->foreignId('ticket_id')->constrained('tickets')->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete(); // User yang melakukan aksi (null = system)
            $table->string('action'); // created, status_changed, assigned, unassigned, commented, attachment_added, priority_changed, closed, reopened, etc.
            $table->string('old_value')->nullable(); // Nilai sebelum perubahan
            $table->string('new_value')->nullable(); // Nilai setelah perubahan
            $table->text('description')->nullable(); // Deskripsi tambahan
            $table->timestamp('created_at'); // Waktu aksi (hanya created_at, tidak perlu updated_at)

            $table->index(['ticket_id', 'created_at']);
            $table->index('action');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ticket_activities');
    }
};
