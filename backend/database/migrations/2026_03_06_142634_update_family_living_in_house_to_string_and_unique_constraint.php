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
        Schema::table('households', function (Blueprint $table) {
            // Change column type to string to support alphanumeric (1A, 1B, etc.)
            $table->string('family_living_in_house', 255)->nullable()->change();

            // Drop old unique constraint
            $table->dropUnique('households_hh_brgy_purok_unique');

            // Add new unique constraint including family_living_in_house
            $table->unique(['household_number', 'barangay', 'purok_sito', 'family_living_in_house'], 'households_hh_brgy_purok_family_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('households', function (Blueprint $table) {
            $table->dropUnique('households_hh_brgy_purok_family_unique');
            $table->unique(['household_number', 'barangay', 'purok_sito'], 'households_hh_brgy_purok_unique');

            // Revert column type to unsigned tiny integer
            // Note: This might fail if data cannot be cast back
            $table->unsignedTinyInteger('family_living_in_house')->default(0)->change();
        });
    }
};
