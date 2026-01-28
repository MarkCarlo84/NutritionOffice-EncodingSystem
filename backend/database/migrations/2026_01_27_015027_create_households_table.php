<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * BNS Form No. 1A - Philippine Plan of Action for Nutrition - HOUSEHOLD PROFILE
     */
    public function up(): void
    {
        Schema::create('households', function (Blueprint $table) {
            $table->id();

            // Location (form header)
            $table->string('purok_sito')->nullable();
            $table->string('barangay')->nullable();
            $table->string('municipality_city')->nullable();
            $table->string('province')->nullable();

            // Household Identification
            $table->string('household_number')->unique(); // C1: HH No.
            $table->unsignedTinyInteger('family_living_in_house')->default(0); // C2: No. of family living in the house
            $table->unsignedTinyInteger('number_of_members')->default(0); // C3: Number of HH members
            $table->string('nhts_household_group', 20)->nullable(); // C4: 1-NHTS 4Ps, 2-NHTS Non-4Ps, 3-Non-NHTS
            $table->string('indigenous_group', 20)->nullable(); // C5: 1-IP, 2-Non-IP

            // Number of Family Members by Age Classification / Health Risk Group
            $table->unsignedTinyInteger('newborn_male')->default(0);   // C6: Newborn (0-28 days) M
            $table->unsignedTinyInteger('newborn_female')->default(0); // C7: F
            $table->unsignedTinyInteger('infant_male')->default(0);     // C8: Infant (29 days-11 months) M
            $table->unsignedTinyInteger('infant_female')->default(0);  // C9: F
            $table->unsignedTinyInteger('under_five_male')->default(0);   // C10: Under-five (1-4 years) M
            $table->unsignedTinyInteger('under_five_female')->default(0); // C11: F
            $table->unsignedTinyInteger('children_male')->default(0);   // C12: Children 5-9 y.o. M
            $table->unsignedTinyInteger('children_female')->default(0);  // C13: F
            $table->unsignedTinyInteger('adolescence_male')->default(0);   // C14: Adolescence (10-19 y.o.) M
            $table->unsignedTinyInteger('adolescence_female')->default(0); // C15: F
            $table->unsignedTinyInteger('pregnant')->default(0);           // C16: Pregnant F
            $table->unsignedTinyInteger('adolescent_pregnant')->default(0); // C17: Adolescent Pregnant F
            $table->unsignedTinyInteger('post_partum')->default(0);        // C18: Post-Partum (PP) F
            $table->unsignedTinyInteger('women_15_49_not_pregnant')->default(0); // C19: 15-49 y.o. not pregnant & non PP F
            $table->unsignedTinyInteger('adult_male')->default(0);   // C20: Adult 20-59 y.o. M
            $table->unsignedTinyInteger('adult_female')->default(0);  // C21: F
            $table->unsignedTinyInteger('senior_citizen_male')->default(0);   // C22: Senior Citizens M
            $table->unsignedTinyInteger('senior_citizen_female')->default(0); // C23: F
            $table->unsignedTinyInteger('pwd_male')->default(0);   // C24: Person With Disability M
            $table->unsignedTinyInteger('pwd_female')->default(0); // C25: F

            // Toilet Type: 1-Improved, 2-Shared, 3-Unimproved, 4-Open defecation
            $table->unsignedTinyInteger('toilet_type')->nullable();
            // Water Source: 1-Improved, 2-Unimproved
            $table->unsignedTinyInteger('water_source')->nullable();
            // Food Production: VG-Vegetable Garden, FT-Fruit, PL-Poultry Livestock, FP-Fish pond, NA-None
            $table->string('food_production_activity', 10)->nullable();

            // Household Practices
            $table->boolean('couple_practicing_family_planning')->nullable();
            $table->boolean('using_iodized_salt')->default(false);   // HH using Iodized Salt
            $table->boolean('using_iron_fortified_rice')->default(false); // HH using Iron-Fortified Rice

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('households');
    }
};
