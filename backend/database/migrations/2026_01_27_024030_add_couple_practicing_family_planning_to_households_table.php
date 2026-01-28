<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * BNS Form: Couple Practicing Family Planning (Yes/No).
     * Only adds column if missing (create_households already includes it for fresh installs).
     */
    public function up(): void
    {
        if (Schema::hasColumn('households', 'couple_practicing_family_planning')) {
            return;
        }
        Schema::table('households', function (Blueprint $table) {
            $table->boolean('couple_practicing_family_planning')->nullable()->after('food_production_activity');
        });
    }

    public function down(): void
    {
        if (Schema::hasColumn('households', 'couple_practicing_family_planning')) {
            Schema::table('households', function (Blueprint $table) {
                $table->dropColumn('couple_practicing_family_planning');
            });
        }
    }
};
