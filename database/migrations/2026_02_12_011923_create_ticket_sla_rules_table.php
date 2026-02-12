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
        Schema::create('ticket_sla_rules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('ticket_type_id')->nullable()->constrained('ticket_types')->nullOnDelete();
            $table->foreignId('ticket_priority_id')->nullable()->constrained('ticket_priorities')->nullOnDelete();
            $table->foreignId('ticket_category_id')->nullable()->constrained('ticket_categories')->nullOnDelete();
            $table->integer('response_minutes')->nullable(); // Batas waktu tanggap (menit)
            $table->integer('resolution_minutes')->nullable(); // Batas waktu selesai (menit)
            $table->boolean('business_hours_only')->default(true); // Hitung hanya jam kerja?
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            // Unique constraint untuk kombinasi
            $table->unique(['ticket_type_id', 'ticket_priority_id', 'ticket_category_id'], 'sla_rule_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ticket_sla_rules');
    }
};
