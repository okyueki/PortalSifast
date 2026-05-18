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
            // Status untuk kontrol publish: draft = belum publish, published = sudah bisa diakses
            $table->string('status', 20)->default('draft')->after('raw_row');
            $table->index('status');

            // Tanggal publish
            $table->timestamp('published_at')->nullable()->after('status');
            $table->unsignedBigInteger('published_by')->nullable()->after('published_at');
            $table->foreign('published_by')->references('id')->on('users')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('employee_salaries', function (Blueprint $table) {
            $table->dropForeign(['published_by']);
            $table->dropColumn(['status', 'published_at', 'published_by']);
        });
    }
};