<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payroll_imports', function (Blueprint $table) {
            $table->id();
            $table->foreignId('imported_by')->nullable()->constrained('users')->nullOnDelete();
            $table->date('period_start');
            $table->string('filename')->nullable();
            $table->integer('total_rows')->default(0);
            $table->integer('imported_count')->default(0);
            $table->integer('skipped_count')->default(0);
            $table->integer('warning_count')->default(0);
            $table->enum('status', ['completed', 'rolled_back'])->default('completed');
            $table->timestamp('rolled_back_at')->nullable();
            $table->foreignId('rolled_back_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        Schema::table('employee_salaries', function (Blueprint $table) {
            $table->foreignId('import_id')->nullable()->after('imported_by')->constrained('payroll_imports')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('employee_salaries', function (Blueprint $table) {
            $table->dropConstrainedForeignId('import_id');
        });

        Schema::dropIfExists('payroll_imports');
    }
};
