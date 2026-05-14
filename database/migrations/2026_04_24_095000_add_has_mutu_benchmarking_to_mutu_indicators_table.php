<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('mutu_indicators', function (Blueprint $table) {
            $table->boolean('has_mutu_benchmarking')->default(false)->after('analysis_period');
        });
    }

    public function down(): void
    {
        Schema::table('mutu_indicators', function (Blueprint $table) {
            $table->dropColumn('has_mutu_benchmarking');
        });
    }
};
