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
        Schema::create('ticket_statuses', function (Blueprint $table) {
            $table->id();
            $table->string('name'); // Baru, Ditugaskan, Dikerjakan, Tertunda, Selesai, Menunggu Konfirmasi, Ditutup
            $table->string('slug')->unique()->nullable();
            $table->string('color')->nullable(); // Warna untuk UI (hex)
            $table->integer('order')->default(0); // Urutan tampilan
            $table->boolean('is_closed')->default(false); // Apakah status ini = tiket sudah selesai
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ticket_statuses');
    }
};
