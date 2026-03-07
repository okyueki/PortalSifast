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
        Schema::create('officer_locations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('officer_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('emergency_report_id')->nullable()->constrained('emergency_reports')->nullOnDelete();
            $table->decimal('latitude', 10, 8);
            $table->decimal('longitude', 11, 8);
            $table->decimal('speed_kmh', 5, 2)->nullable();
            $table->unsignedSmallInteger('heading')->nullable(); // 0-360 derajat
            $table->unsignedInteger('eta_minutes')->nullable();
            $table->unsignedInteger('distance_meters')->nullable();
            $table->timestamps();

            $table->index(['officer_id', 'created_at']);
            $table->index(['emergency_report_id', 'created_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('officer_locations');
    }
};
