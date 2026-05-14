<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->boolean('can_manage_mutu')->default(false)->after('can_access_payroll');
            $table->boolean('can_input_mutu')->default(false)->after('can_manage_mutu');
            $table->boolean('can_view_mutu_dashboard')->default(false)->after('can_input_mutu');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'can_manage_mutu',
                'can_input_mutu',
                'can_view_mutu_dashboard',
            ]);
        });
    }
};
