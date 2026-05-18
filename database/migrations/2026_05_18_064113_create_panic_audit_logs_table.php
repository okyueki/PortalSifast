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
        Schema::create('panic_audit_logs', function (Blueprint $table) {
            $table->id();

            $table->foreignId('report_id')
                ->constrained('emergency_reports')
                ->onDelete('cascade');

            $table->foreignId('user_id')
                ->constrained()
                ->onDelete('cascade');

            $table->string('action'); // accept, respond, in_progress, arrived, resolved, cancelled
            $table->json('data')->nullable(); // Additional data (status change, notes, etc.)
            $table->timestamp('created_at');

            // Indexes for fast queries
            $table->index(['report_id', 'created_at']);
            $table->index(['user_id', 'created_at']);
            $table->index('action');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('panic_audit_logs');
    }
};