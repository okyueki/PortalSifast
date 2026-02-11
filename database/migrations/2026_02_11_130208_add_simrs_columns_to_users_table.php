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
        Schema::table('users', function (Blueprint $table) {
            $table->string('simrs_nik', 50)->nullable()->unique()->after('email');
            $table->string('phone', 20)->nullable()->after('simrs_nik');
            $table->string('source', 20)->nullable()->default('manual')->after('phone');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['simrs_nik', 'phone', 'source']);
        });
    }
};
