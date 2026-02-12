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
        Schema::create('ticket_vendor_costs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('ticket_id')->constrained('tickets')->cascadeOnDelete();
            $table->string('vendor_name'); // Nama vendor yang terlibat
            $table->decimal('estimated_cost', 15, 2)->nullable(); // Estimasi biaya perbaikan
            $table->decimal('actual_cost', 15, 2)->nullable(); // Biaya realisasi
            $table->text('sparepart_notes')->nullable(); // Catatan sparepart yang diganti
            $table->text('vendor_notes')->nullable(); // Catatan tambahan terkait pekerjaan vendor
            $table->date('work_date')->nullable(); // Tanggal pengerjaan vendor
            $table->timestamps();

            $table->index('ticket_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ticket_vendor_costs');
    }
};
