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
            $table->dropUnique('households_household_number_barangay_unique');
            $table->unique(['household_number', 'barangay', 'purok_sito'], 'households_hh_brgy_purok_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('households', function (Blueprint $table) {
            $table->dropUnique('households_hh_brgy_purok_unique');
            $table->unique(['household_number', 'barangay'], 'households_household_number_barangay_unique');
        });
    }
};
