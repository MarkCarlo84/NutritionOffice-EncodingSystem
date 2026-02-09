<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Allow same household_number in different barangays; duplicate = same HH No. + same barangay.
     */
    public function up(): void
    {
        Schema::table('households', function (Blueprint $table) {
            $table->dropUnique(['household_number']);
        });
        Schema::table('households', function (Blueprint $table) {
            $table->unique(['household_number', 'barangay'], 'households_household_number_barangay_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('households', function (Blueprint $table) {
            $table->dropUnique('households_household_number_barangay_unique');
        });
        Schema::table('households', function (Blueprint $table) {
            $table->unique('household_number');
        });
    }
};
