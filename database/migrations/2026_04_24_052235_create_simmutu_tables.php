<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('mutu_categories', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('short_name', 64)->nullable();
            $table->string('scope', 32);
            $table->text('description')->nullable();
            $table->boolean('is_general_use')->default(false);
            $table->boolean('has_mutu_benchmarking')->default(false);
            $table->string('obligation_profile', 32)->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('mutu_indicators', function (Blueprint $table) {
            $table->id();
            $table->foreignId('mutu_category_id')->constrained('mutu_categories')->cascadeOnDelete();
            $table->string('title');
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->date('valid_from')->nullable();
            $table->date('valid_until')->nullable();
            $table->foreignId('accountable_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('indicator_kind', 32);
            $table->string('collection_frequency', 32);
            $table->text('numerator_definition');
            $table->text('denominator_definition');
            $table->string('analysis_period', 32);
            $table->string('data_source')->nullable();
            $table->decimal('target_value', 12, 4)->nullable();
            $table->decimal('weight_in_category', 10, 4)->default(1);
            $table->timestamps();
        });

        Schema::create('mutu_indicator_departemen', function (Blueprint $table) {
            $table->id();
            $table->foreignId('mutu_indicator_id')->constrained('mutu_indicators')->cascadeOnDelete();
            $table->string('dep_id', 32);
            $table->timestamps();

            $table->unique(['mutu_indicator_id', 'dep_id'], 'mutu_ind_dep_unique');
        });

        Schema::create('mutu_realisations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('mutu_indicator_id')->constrained('mutu_indicators')->cascadeOnDelete();
            $table->string('dep_id', 32);
            $table->string('collection_frequency', 32);
            $table->string('period_anchor', 48);
            $table->decimal('numerator_value', 16, 4);
            $table->decimal('denominator_value', 16, 4);
            $table->decimal('achievement_percent', 10, 4)->nullable();
            $table->foreignId('input_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('source', 32)->default('manual');
            $table->boolean('is_override')->default(false);
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->unique(['mutu_indicator_id', 'dep_id', 'period_anchor'], 'mutu_real_unique');
            $table->index(['dep_id', 'period_anchor'], 'mutu_real_dep_anchor_idx');
        });

        Schema::create('mutu_period_scores', function (Blueprint $table) {
            $table->id();
            $table->foreignId('mutu_category_id')->constrained('mutu_categories')->cascadeOnDelete();
            $table->string('dep_id', 32);
            $table->string('analysis_period_type', 32);
            $table->string('period_anchor', 48);
            $table->decimal('weighted_score', 12, 4)->nullable();
            $table->decimal('benchmark_score', 12, 4)->nullable();
            $table->unsignedSmallInteger('indicator_count')->nullable();
            $table->timestamp('computed_at')->nullable();
            $table->timestamps();

            $table->unique(
                ['mutu_category_id', 'dep_id', 'analysis_period_type', 'period_anchor'],
                'mutu_period_scores_uq'
            );
            $table->index(['dep_id', 'period_anchor'], 'mutu_scores_dep_anchor_idx');
        });

        Schema::create('mutu_period_analyses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('mutu_category_id')->constrained('mutu_categories')->cascadeOnDelete();
            $table->string('dep_id', 32);
            $table->string('period_anchor', 48);
            $table->text('analysis_text');
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->unique(['mutu_category_id', 'dep_id', 'period_anchor'], 'mutu_analyses_uq');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('mutu_period_analyses');
        Schema::dropIfExists('mutu_period_scores');
        Schema::dropIfExists('mutu_realisations');
        Schema::dropIfExists('mutu_indicator_departemen');
        Schema::dropIfExists('mutu_indicators');
        Schema::dropIfExists('mutu_categories');
    }
};
