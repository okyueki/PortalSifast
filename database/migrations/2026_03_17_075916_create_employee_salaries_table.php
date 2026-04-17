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
        Schema::create('employee_salaries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('imported_by')->nullable()->constrained('users')->nullOnDelete();

            $table->date('period_start');

            $table->string('simrs_nik')->index();
            $table->string('employee_name')->nullable();
            $table->string('unit')->nullable();
            $table->string('npwp')->nullable();

            $table->unsignedInteger('salary_no')->nullable();
            $table->unsignedInteger('ref_no')->nullable();

            $table->decimal('penerimaan', 15, 2)->nullable();
            $table->decimal('pembulatan', 15, 2)->nullable();
            $table->decimal('pajak', 15, 2)->nullable();
            $table->decimal('zakat', 15, 2)->nullable();

            $table->json('raw_row');
            $table->timestamps();

            $table->unique(['period_start', 'simrs_nik']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('employee_salaries');
    }
};
