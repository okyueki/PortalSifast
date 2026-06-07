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
        Schema::table('employee_salaries', function (Blueprint $table) {
            $table->decimal('tunj_masa_kerja', 15, 2)->nullable()->after('keluarga');
            $table->decimal('tunj_kehadiran', 15, 2)->nullable()->after('tunj_masa_kerja');
            $table->decimal('tunj_makan', 15, 2)->nullable()->after('tunj_kehadiran');
            $table->string('jkn_label', 120)->nullable()->after('jkn');
            $table->string('umum_label', 120)->nullable()->after('umum');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('employee_salaries', function (Blueprint $table) {
            $table->dropColumn([
                'tunj_masa_kerja',
                'tunj_kehadiran',
                'tunj_makan',
                'jkn_label',
                'umum_label',
            ]);
        });
    }
};
