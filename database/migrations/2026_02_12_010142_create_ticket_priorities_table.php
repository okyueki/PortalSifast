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
        Schema::create('ticket_priorities', function (Blueprint $table) {
            $table->id();
            $table->string('name'); // P1, P2, P3, P4
            $table->integer('level')->default(1); // Urutan 1-4 (1 = paling urgent)
            $table->text('description')->nullable(); // Dampak/urgensi
            $table->string('color')->nullable(); // Warna untuk UI (hex)
            $table->integer('response_hours')->nullable(); // Target waktu tanggap (jam)
            $table->integer('resolution_hours')->nullable(); // Target waktu selesai (jam)
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ticket_priorities');
    }
};
