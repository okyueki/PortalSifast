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
            // Role untuk ticketing: admin, staff, pemohon
            $table->string('role')->default('pemohon')->after('email');

            // Departemen user (untuk staff IT/IPS)
            $table->string('dep_id')->nullable()->after('role'); // FK ke departemen.dep_id

            $table->index('role');
            $table->index('dep_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex(['role']);
            $table->dropIndex(['dep_id']);
            $table->dropColumn(['role', 'dep_id']);
        });
    }
};
