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
        Schema::create('tickets', function (Blueprint $table) {
            $table->id();
            $table->string('ticket_number')->unique(); // Nomor tiket unik (auto-generate)

            // Relasi ke master
            $table->foreignId('ticket_type_id')->constrained('ticket_types');
            $table->foreignId('ticket_category_id')->constrained('ticket_categories');
            $table->foreignId('ticket_subcategory_id')->nullable()->constrained('ticket_subcategories')->nullOnDelete();
            $table->foreignId('ticket_priority_id')->constrained('ticket_priorities');
            $table->foreignId('ticket_status_id')->constrained('ticket_statuses');

            // Departemen penanggung jawab
            $table->string('dep_id'); // FK ke departemen.dep_id

            // Pemohon dan penanggung jawab
            $table->foreignId('requester_id')->constrained('users'); // Pemohon
            $table->foreignId('assignee_id')->nullable()->constrained('users')->nullOnDelete(); // Primary assignee (bisa null = unassigned pool)

            // Detail tiket
            $table->string('title');
            $table->text('description')->nullable();

            // Waktu
            $table->timestamp('due_date')->nullable(); // Due date (untuk pengembangan: di-set Head IT)
            $table->timestamp('response_due_at')->nullable(); // Batas waktu tanggap (SLA)
            $table->timestamp('resolution_due_at')->nullable(); // Batas waktu selesai (SLA)
            $table->timestamp('first_response_at')->nullable(); // Waktu respons pertama
            $table->timestamp('resolved_at')->nullable(); // Waktu selesai
            $table->timestamp('closed_at')->nullable(); // Waktu ditutup (untuk auto-close)

            // Relasi tiket
            $table->foreignId('related_ticket_id')->nullable()->constrained('tickets')->nullOnDelete(); // Referensi tiket sebelumnya

            // Aset (untuk IPS - fase 2)
            $table->unsignedBigInteger('asset_id')->nullable(); // FK ke tabel aset (belum ada)

            $table->timestamps();

            // Index
            $table->index('dep_id');
            $table->index('ticket_number');
            $table->index(['ticket_status_id', 'dep_id']);
            $table->index(['assignee_id', 'ticket_status_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tickets');
    }
};
