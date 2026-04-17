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
        Schema::table('tickets', function (Blueprint $table) {
            $table->boolean('is_draft')->default(false)->after('asset_no_inventaris');
            $table->timestamp('published_at')->nullable()->after('is_draft');
            $table->text('plan_ideas')->nullable()->after('published_at');
            $table->text('plan_tools')->nullable()->after('plan_ideas');
            $table->unsignedBigInteger('budget_estimate')->nullable()->after('plan_tools');
            $table->text('budget_notes')->nullable()->after('budget_estimate');

            $table->index(['is_draft', 'requester_id'], 'tickets_is_draft_requester_idx');
            $table->index('published_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tickets', function (Blueprint $table) {
            $table->dropIndex('tickets_is_draft_requester_idx');
            $table->dropIndex(['published_at']);
            $table->dropColumn([
                'is_draft',
                'published_at',
                'plan_ideas',
                'plan_tools',
                'budget_estimate',
                'budget_notes',
            ]);
        });
    }
};
