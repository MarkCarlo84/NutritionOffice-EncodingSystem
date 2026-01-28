<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * FAMILY PROFILE Survey Summary – structure from the survey form.
     */
    public function up(): void
    {
        Schema::create('family_profile_survey_summaries', function (Blueprint $table) {
            $table->id();

            // Basic Information
            $table->string('barangay_nutrition_scholar')->nullable();
            $table->string('barangay')->nullable();
            $table->string('purok_block_street')->nullable();
            $table->string('survey_period')->nullable();
            $table->string('survey_year', 10)->nullable();

            // Totals
            $table->unsignedInteger('total_households')->default(0);
            $table->unsignedInteger('total_families')->default(0);
            $table->unsignedInteger('total_purok_block_street')->default(0);
            $table->unsignedInteger('total_population')->default(0);

            // Family Size Distribution
            $table->unsignedInteger('family_size_more_than_10')->default(0);
            $table->unsignedInteger('family_size_8_to_10')->default(0);
            $table->unsignedInteger('family_size_6_to_7')->default(0);
            $table->unsignedInteger('family_size_2_to_5')->default(0);
            $table->unsignedInteger('family_size_1')->default(0);

            // No. of Family Members by Age Classification & Health Risk Group
            $table->unsignedInteger('newborn')->default(0);
            $table->unsignedInteger('infants')->default(0);
            $table->unsignedInteger('under_five')->default(0);
            $table->unsignedInteger('children_5_9')->default(0);
            $table->unsignedInteger('adolescence')->default(0);
            $table->unsignedInteger('adult')->default(0);
            $table->unsignedInteger('pregnant')->default(0);
            $table->unsignedInteger('adolescent_pregnant')->default(0);
            $table->unsignedInteger('post_partum')->default(0);
            $table->unsignedInteger('women_15_49_not_pregnant')->default(0);
            $table->unsignedInteger('senior_citizens')->default(0);
            $table->unsignedInteger('pwd')->default(0);

            // Father: Occupation (counts per category 1–11)
            $table->unsignedInteger('father_occ_manager')->default(0);
            $table->unsignedInteger('father_occ_professional')->default(0);
            $table->unsignedInteger('father_occ_technician')->default(0);
            $table->unsignedInteger('father_occ_clerical')->default(0);
            $table->unsignedInteger('father_occ_service_sales')->default(0);
            $table->unsignedInteger('father_occ_skilled_agri')->default(0);
            $table->unsignedInteger('father_occ_craft')->default(0);
            $table->unsignedInteger('father_occ_plant_machine')->default(0);
            $table->unsignedInteger('father_occ_elementary')->default(0);
            $table->unsignedInteger('father_occ_armed_forces')->default(0);
            $table->unsignedInteger('father_occ_none')->default(0);

            // Father: Educational Attainment
            $table->unsignedInteger('father_ed_none')->default(0);
            $table->unsignedInteger('father_ed_elem_undergrad')->default(0);
            $table->unsignedInteger('father_ed_elem_grad')->default(0);
            $table->unsignedInteger('father_ed_hs_undergrad')->default(0);
            $table->unsignedInteger('father_ed_hs_grad')->default(0);
            $table->unsignedInteger('father_ed_college_undergrad')->default(0);
            $table->unsignedInteger('father_ed_college_grad')->default(0);
            $table->unsignedInteger('father_ed_vocational')->default(0);
            $table->unsignedInteger('father_ed_post_grad')->default(0);

            // Mother: Occupation (same 11 categories)
            $table->unsignedInteger('mother_occ_manager')->default(0);
            $table->unsignedInteger('mother_occ_professional')->default(0);
            $table->unsignedInteger('mother_occ_technician')->default(0);
            $table->unsignedInteger('mother_occ_clerical')->default(0);
            $table->unsignedInteger('mother_occ_service_sales')->default(0);
            $table->unsignedInteger('mother_occ_skilled_agri')->default(0);
            $table->unsignedInteger('mother_occ_craft')->default(0);
            $table->unsignedInteger('mother_occ_plant_machine')->default(0);
            $table->unsignedInteger('mother_occ_elementary')->default(0);
            $table->unsignedInteger('mother_occ_armed_forces')->default(0);
            $table->unsignedInteger('mother_occ_none')->default(0);

            // Mother: Educational Attainment
            $table->unsignedInteger('mother_ed_none')->default(0);
            $table->unsignedInteger('mother_ed_elem_undergrad')->default(0);
            $table->unsignedInteger('mother_ed_elem_grad')->default(0);
            $table->unsignedInteger('mother_ed_hs_undergrad')->default(0);
            $table->unsignedInteger('mother_ed_hs_grad')->default(0);
            $table->unsignedInteger('mother_ed_college_undergrad')->default(0);
            $table->unsignedInteger('mother_ed_college_grad')->default(0);
            $table->unsignedInteger('mother_ed_vocational')->default(0);
            $table->unsignedInteger('mother_ed_post_grad')->default(0);

            // Caregiver: Occupation
            $table->unsignedInteger('caregiver_occ_manager')->default(0);
            $table->unsignedInteger('caregiver_occ_professional')->default(0);
            $table->unsignedInteger('caregiver_occ_technician')->default(0);
            $table->unsignedInteger('caregiver_occ_clerical')->default(0);
            $table->unsignedInteger('caregiver_occ_service_sales')->default(0);
            $table->unsignedInteger('caregiver_occ_skilled_agri')->default(0);
            $table->unsignedInteger('caregiver_occ_craft')->default(0);
            $table->unsignedInteger('caregiver_occ_plant_machine')->default(0);
            $table->unsignedInteger('caregiver_occ_elementary')->default(0);
            $table->unsignedInteger('caregiver_occ_armed_forces')->default(0);
            $table->unsignedInteger('caregiver_occ_none')->default(0);

            // Caregiver: Educational Attainment
            $table->unsignedInteger('caregiver_ed_none')->default(0);
            $table->unsignedInteger('caregiver_ed_elem_undergrad')->default(0);
            $table->unsignedInteger('caregiver_ed_elem_grad')->default(0);
            $table->unsignedInteger('caregiver_ed_hs_undergrad')->default(0);
            $table->unsignedInteger('caregiver_ed_hs_grad')->default(0);
            $table->unsignedInteger('caregiver_ed_college_undergrad')->default(0);
            $table->unsignedInteger('caregiver_ed_college_grad')->default(0);
            $table->unsignedInteger('caregiver_ed_vocational')->default(0);
            $table->unsignedInteger('caregiver_ed_post_grad')->default(0);

            // Household Practices Summary
            $table->unsignedInteger('couple_practicing_family_planning')->default(0);
            $table->unsignedInteger('toilet_improved')->default(0);
            $table->unsignedInteger('toilet_shared')->default(0);
            $table->unsignedInteger('toilet_unimproved')->default(0);
            $table->unsignedInteger('toilet_open_defecation')->default(0);
            $table->unsignedInteger('water_improved')->default(0);
            $table->unsignedInteger('water_unimproved')->default(0);
            $table->unsignedInteger('food_veg_garden')->default(0);
            $table->unsignedInteger('food_fruit')->default(0);
            $table->unsignedInteger('food_poultry_livestock')->default(0);
            $table->unsignedInteger('food_fishpond')->default(0);
            $table->unsignedInteger('food_none')->default(0);
            $table->unsignedInteger('using_iodized_salt')->default(0);
            $table->unsignedInteger('using_iron_fortified_rice')->default(0);

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('family_profile_survey_summaries');
    }
};
