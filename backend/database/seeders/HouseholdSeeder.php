<?php

namespace Database\Seeders;

use App\Models\Household;
use App\Models\HouseholdMember;
use Illuminate\Database\Seeder;

class HouseholdSeeder extends Seeder
{
    /**
     * Run the database seeds.
     * Provides 15–20 dummy households for Encoding_system (BNS Form structure).
     */
    public function run(): void
    {
        $barangays = [
            'Baclaran', 'Banay-Banay', 'Banlic', 'Bigaa', 'Butong', 'Casile', 'Diezmo',
            'Pulo', 'Sala', 'San Isidro', 'Poblacion Uno', 'Poblacion Dos', 'Poblacion Tres',
        ];

        $puroks = ['Purok 1', 'Purok 2', 'Purok 3', 'Purok 4', 'Purok 5', 'Block A', 'Block B', 'Sitio Malinis'];

        $households = [
            [
                'purok_sito' => 'Purok 1', 'barangay' => 'Baclaran', 'municipality_city' => 'Cabuyao', 'province' => 'Laguna',
                'household_number' => 'HH-BAC-001', 'family_living_in_house' => 1, 'number_of_members' => 5,
                'nhts_household_group' => '1', 'indigenous_group' => '2',
                'newborn_male' => 0, 'newborn_female' => 0, 'infant_male' => 0, 'infant_female' => 1,
                'under_five_male' => 1, 'under_five_female' => 0, 'children_male' => 1, 'children_female' => 0,
                'adolescence_male' => 0, 'adolescence_female' => 0, 'pregnant' => 0, 'adolescent_pregnant' => 0,
                'post_partum' => 0, 'women_15_49_not_pregnant' => 1, 'adult_male' => 1, 'adult_female' => 1,
                'senior_citizen_male' => 0, 'senior_citizen_female' => 0, 'pwd_male' => 0, 'pwd_female' => 0,
                'toilet_type' => 1, 'water_source' => 1, 'food_production_activity' => 'VG',
                'couple_practicing_family_planning' => true, 'using_iodized_salt' => true, 'using_iron_fortified_rice' => true,
                'members' => [
                    ['role' => 'father', 'name' => 'Roberto Santos', 'occupation' => '6', 'educational_attainment' => 'EG', 'practicing_family_planning' => true],
                    ['role' => 'mother', 'name' => 'Maria Santos', 'occupation' => '11', 'educational_attainment' => 'HG', 'practicing_family_planning' => true],
                ],
            ],
            [
                'purok_sito' => 'Purok 2', 'barangay' => 'Banay-Banay', 'municipality_city' => 'Cabuyao', 'province' => 'Laguna',
                'household_number' => 'HH-BAN-002', 'family_living_in_house' => 1, 'number_of_members' => 4,
                'nhts_household_group' => '2', 'indigenous_group' => '2',
                'newborn_male' => 0, 'newborn_female' => 0, 'infant_male' => 0, 'infant_female' => 0,
                'under_five_male' => 0, 'under_five_female' => 1, 'children_male' => 1, 'children_female' => 0,
                'adolescence_male' => 0, 'adolescence_female' => 1, 'pregnant' => 0, 'adolescent_pregnant' => 0,
                'post_partum' => 0, 'women_15_49_not_pregnant' => 0, 'adult_male' => 1, 'adult_female' => 1,
                'senior_citizen_male' => 0, 'senior_citizen_female' => 0, 'pwd_male' => 0, 'pwd_female' => 0,
                'toilet_type' => 2, 'water_source' => 1, 'food_production_activity' => 'PL',
                'couple_practicing_family_planning' => false, 'using_iodized_salt' => true, 'using_iron_fortified_rice' => false,
                'members' => [
                    ['role' => 'father', 'name' => 'Juan Dela Cruz', 'occupation' => '6', 'educational_attainment' => 'HU', 'practicing_family_planning' => false],
                    ['role' => 'mother', 'name' => 'Rosa Dela Cruz', 'occupation' => '11', 'educational_attainment' => 'EG', 'practicing_family_planning' => false],
                    ['role' => 'caregiver', 'name' => 'Lola Petra', 'occupation' => '11', 'educational_attainment' => 'N', 'practicing_family_planning' => false],
                ],
            ],
            [
                'purok_sito' => 'Purok 3', 'barangay' => 'Banlic', 'municipality_city' => 'Cabuyao', 'province' => 'Laguna',
                'household_number' => 'HH-BAN-003', 'family_living_in_house' => 1, 'number_of_members' => 6,
                'nhts_household_group' => '1', 'indigenous_group' => '2',
                'newborn_male' => 1, 'newborn_female' => 0, 'infant_male' => 0, 'infant_female' => 0,
                'under_five_male' => 1, 'under_five_female' => 1, 'children_male' => 0, 'children_female' => 1,
                'adolescence_male' => 1, 'adolescence_female' => 0, 'pregnant' => 0, 'adolescent_pregnant' => 0,
                'post_partum' => 1, 'women_15_49_not_pregnant' => 0, 'adult_male' => 1, 'adult_female' => 1,
                'senior_citizen_male' => 0, 'senior_citizen_female' => 0, 'pwd_male' => 0, 'pwd_female' => 0,
                'toilet_type' => 1, 'water_source' => 1, 'food_production_activity' => 'VG',
                'couple_practicing_family_planning' => true, 'using_iodized_salt' => true, 'using_iron_fortified_rice' => true,
                'members' => [
                    ['role' => 'father', 'name' => 'Pedro Reyes', 'occupation' => '5', 'educational_attainment' => 'CG', 'practicing_family_planning' => true],
                    ['role' => 'mother', 'name' => 'Elena Reyes', 'occupation' => '4', 'educational_attainment' => 'CG', 'practicing_family_planning' => true],
                ],
            ],
            [
                'purok_sito' => 'Block A', 'barangay' => 'Bigaa', 'municipality_city' => 'Cabuyao', 'province' => 'Laguna',
                'household_number' => 'HH-BIG-004', 'family_living_in_house' => 2, 'number_of_members' => 8,
                'nhts_household_group' => '3', 'indigenous_group' => '2',
                'newborn_male' => 0, 'newborn_female' => 0, 'infant_male' => 0, 'infant_female' => 0,
                'under_five_male' => 0, 'under_five_female' => 0, 'children_male' => 2, 'children_female' => 2,
                'adolescence_male' => 0, 'adolescence_female' => 0, 'pregnant' => 0, 'adolescent_pregnant' => 0,
                'post_partum' => 0, 'women_15_49_not_pregnant' => 1, 'adult_male' => 2, 'adult_female' => 1,
                'senior_citizen_male' => 1, 'senior_citizen_female' => 1, 'pwd_male' => 0, 'pwd_female' => 0,
                'toilet_type' => 1, 'water_source' => 1, 'food_production_activity' => 'FP',
                'couple_practicing_family_planning' => false, 'using_iodized_salt' => true, 'using_iron_fortified_rice' => true,
                'members' => [
                    ['role' => 'father', 'name' => 'Antonio Garcia', 'occupation' => '6', 'educational_attainment' => 'HG', 'practicing_family_planning' => false],
                    ['role' => 'mother', 'name' => 'Carmen Garcia', 'occupation' => '11', 'educational_attainment' => 'HU', 'practicing_family_planning' => false],
                ],
            ],
            [
                'purok_sito' => 'Purok 4', 'barangay' => 'Butong', 'municipality_city' => 'Cabuyao', 'province' => 'Laguna',
                'household_number' => 'HH-BUT-005', 'family_living_in_house' => 1, 'number_of_members' => 3,
                'nhts_household_group' => '2', 'indigenous_group' => '1',
                'newborn_male' => 0, 'newborn_female' => 0, 'infant_male' => 0, 'infant_female' => 0,
                'under_five_male' => 0, 'under_five_female' => 0, 'children_male' => 1, 'children_female' => 0,
                'adolescence_male' => 0, 'adolescence_female' => 0, 'pregnant' => 0, 'adolescent_pregnant' => 0,
                'post_partum' => 0, 'women_15_49_not_pregnant' => 1, 'adult_male' => 1, 'adult_female' => 1,
                'senior_citizen_male' => 0, 'senior_citizen_female' => 0, 'pwd_male' => 0, 'pwd_female' => 0,
                'toilet_type' => 2, 'water_source' => 2, 'food_production_activity' => 'NA',
                'couple_practicing_family_planning' => true, 'using_iodized_salt' => false, 'using_iron_fortified_rice' => false,
                'members' => [
                    ['role' => 'father', 'name' => 'Miguel Torres', 'occupation' => '7', 'educational_attainment' => 'EG', 'practicing_family_planning' => true],
                    ['role' => 'mother', 'name' => 'Teresa Torres', 'occupation' => '11', 'educational_attainment' => 'EU', 'practicing_family_planning' => true],
                ],
            ],
            [
                'purok_sito' => 'Sitio Malinis', 'barangay' => 'Casile', 'municipality_city' => 'Cabuyao', 'province' => 'Laguna',
                'household_number' => 'HH-CAS-006', 'family_living_in_house' => 1, 'number_of_members' => 7,
                'nhts_household_group' => '1', 'indigenous_group' => '2',
                'newborn_male' => 0, 'newborn_female' => 1, 'infant_male' => 1, 'infant_female' => 0,
                'under_five_male' => 0, 'under_five_female' => 1, 'children_male' => 1, 'children_female' => 0,
                'adolescence_male' => 0, 'adolescence_female' => 0, 'pregnant' => 0, 'adolescent_pregnant' => 0,
                'post_partum' => 0, 'women_15_49_not_pregnant' => 1, 'adult_male' => 1, 'adult_female' => 1,
                'senior_citizen_male' => 0, 'senior_citizen_female' => 1, 'pwd_male' => 0, 'pwd_female' => 0,
                'toilet_type' => 1, 'water_source' => 1, 'food_production_activity' => 'VG',
                'couple_practicing_family_planning' => true, 'using_iodized_salt' => true, 'using_iron_fortified_rice' => true,
                'members' => [
                    ['role' => 'father', 'name' => 'Felipe Mendoza', 'occupation' => '6', 'educational_attainment' => 'HG', 'practicing_family_planning' => true],
                    ['role' => 'mother', 'name' => 'Lucia Mendoza', 'occupation' => '11', 'educational_attainment' => 'HG', 'practicing_family_planning' => true],
                    ['role' => 'caregiver', 'name' => 'Lolo Andres', 'occupation' => '11', 'educational_attainment' => 'N', 'practicing_family_planning' => false],
                ],
            ],
            [
                'purok_sito' => 'Purok 5', 'barangay' => 'Diezmo', 'municipality_city' => 'Cabuyao', 'province' => 'Laguna',
                'household_number' => 'HH-DIE-007', 'family_living_in_house' => 1, 'number_of_members' => 4,
                'nhts_household_group' => '2', 'indigenous_group' => '2',
                'newborn_male' => 0, 'newborn_female' => 0, 'infant_male' => 0, 'infant_female' => 0,
                'under_five_male' => 1, 'under_five_female' => 0, 'children_male' => 0, 'children_female' => 1,
                'adolescence_male' => 0, 'adolescence_female' => 0, 'pregnant' => 0, 'adolescent_pregnant' => 0,
                'post_partum' => 0, 'women_15_49_not_pregnant' => 1, 'adult_male' => 1, 'adult_female' => 1,
                'senior_citizen_male' => 0, 'senior_citizen_female' => 0, 'pwd_male' => 0, 'pwd_female' => 0,
                'toilet_type' => 1, 'water_source' => 1, 'food_production_activity' => 'FT',
                'couple_practicing_family_planning' => true, 'using_iodized_salt' => true, 'using_iron_fortified_rice' => true,
                'members' => [
                    ['role' => 'father', 'name' => 'Ramon Villanueva', 'occupation' => '2', 'educational_attainment' => 'CG', 'practicing_family_planning' => true],
                    ['role' => 'mother', 'name' => 'Sandra Villanueva', 'occupation' => '4', 'educational_attainment' => 'CG', 'practicing_family_planning' => true],
                ],
            ],
            [
                'purok_sito' => 'Block B', 'barangay' => 'Pulo', 'municipality_city' => 'Cabuyao', 'province' => 'Laguna',
                'household_number' => 'HH-PUL-008', 'family_living_in_house' => 1, 'number_of_members' => 5,
                'nhts_household_group' => '3', 'indigenous_group' => '2',
                'newborn_male' => 0, 'newborn_female' => 0, 'infant_male' => 0, 'infant_female' => 0,
                'under_five_male' => 0, 'under_five_female' => 0, 'children_male' => 1, 'children_female' => 1,
                'adolescence_male' => 1, 'adolescence_female' => 0, 'pregnant' => 0, 'adolescent_pregnant' => 0,
                'post_partum' => 0, 'women_15_49_not_pregnant' => 1, 'adult_male' => 1, 'adult_female' => 1,
                'senior_citizen_male' => 0, 'senior_citizen_female' => 0, 'pwd_male' => 0, 'pwd_female' => 0,
                'toilet_type' => 2, 'water_source' => 1, 'food_production_activity' => 'PL',
                'couple_practicing_family_planning' => false, 'using_iodized_salt' => true, 'using_iron_fortified_rice' => false,
                'members' => [
                    ['role' => 'father', 'name' => 'Carlos Ramos', 'occupation' => '8', 'educational_attainment' => 'HU', 'practicing_family_planning' => false],
                    ['role' => 'mother', 'name' => 'Ana Ramos', 'occupation' => '11', 'educational_attainment' => 'EG', 'practicing_family_planning' => false],
                ],
            ],
            [
                'purok_sito' => 'Purok 1', 'barangay' => 'Sala', 'municipality_city' => 'Cabuyao', 'province' => 'Laguna',
                'household_number' => 'HH-SAL-009', 'family_living_in_house' => 1, 'number_of_members' => 2,
                'nhts_household_group' => '2', 'indigenous_group' => '2',
                'newborn_male' => 0, 'newborn_female' => 0, 'infant_male' => 0, 'infant_female' => 0,
                'under_five_male' => 0, 'under_five_female' => 0, 'children_male' => 0, 'children_female' => 0,
                'adolescence_male' => 0, 'adolescence_female' => 0, 'pregnant' => 0, 'adolescent_pregnant' => 0,
                'post_partum' => 0, 'women_15_49_not_pregnant' => 1, 'adult_male' => 1, 'adult_female' => 1,
                'senior_citizen_male' => 0, 'senior_citizen_female' => 0, 'pwd_male' => 0, 'pwd_female' => 0,
                'toilet_type' => 1, 'water_source' => 1, 'food_production_activity' => 'NA',
                'couple_practicing_family_planning' => true, 'using_iodized_salt' => true, 'using_iron_fortified_rice' => true,
                'members' => [
                    ['role' => 'father', 'name' => 'Jose Fernandez', 'occupation' => '3', 'educational_attainment' => 'CG', 'practicing_family_planning' => true],
                    ['role' => 'mother', 'name' => 'Liza Fernandez', 'occupation' => '5', 'educational_attainment' => 'HG', 'practicing_family_planning' => true],
                ],
            ],
            [
                'purok_sito' => 'Purok 2', 'barangay' => 'San Isidro', 'municipality_city' => 'Cabuyao', 'province' => 'Laguna',
                'household_number' => 'HH-SID-010', 'family_living_in_house' => 1, 'number_of_members' => 6,
                'nhts_household_group' => '1', 'indigenous_group' => '2',
                'newborn_male' => 0, 'newborn_female' => 0, 'infant_male' => 1, 'infant_female' => 0,
                'under_five_male' => 1, 'under_five_female' => 0, 'children_male' => 1, 'children_female' => 0,
                'adolescence_male' => 0, 'adolescence_female' => 0, 'pregnant' => 1, 'adolescent_pregnant' => 0,
                'post_partum' => 0, 'women_15_49_not_pregnant' => 0, 'adult_male' => 1, 'adult_female' => 1,
                'senior_citizen_male' => 0, 'senior_citizen_female' => 1, 'pwd_male' => 0, 'pwd_female' => 0,
                'toilet_type' => 1, 'water_source' => 1, 'food_production_activity' => 'VG',
                'couple_practicing_family_planning' => true, 'using_iodized_salt' => true, 'using_iron_fortified_rice' => true,
                'members' => [
                    ['role' => 'father', 'name' => 'Edgardo Lopez', 'occupation' => '6', 'educational_attainment' => 'EG', 'practicing_family_planning' => true],
                    ['role' => 'mother', 'name' => 'Corazon Lopez', 'occupation' => '11', 'educational_attainment' => 'HG', 'practicing_family_planning' => true],
                ],
            ],
            [
                'purok_sito' => 'Purok 1', 'barangay' => 'Poblacion Uno', 'municipality_city' => 'Cabuyao', 'province' => 'Laguna',
                'household_number' => 'HH-POB1-011', 'family_living_in_house' => 1, 'number_of_members' => 4,
                'nhts_household_group' => '1', 'indigenous_group' => '2',
                'newborn_male' => 0, 'newborn_female' => 0, 'infant_male' => 0, 'infant_female' => 0,
                'under_five_male' => 0, 'under_five_female' => 1, 'children_male' => 0, 'children_female' => 1,
                'adolescence_male' => 0, 'adolescence_female' => 0, 'pregnant' => 0, 'adolescent_pregnant' => 0,
                'post_partum' => 0, 'women_15_49_not_pregnant' => 1, 'adult_male' => 1, 'adult_female' => 1,
                'senior_citizen_male' => 0, 'senior_citizen_female' => 0, 'pwd_male' => 0, 'pwd_female' => 0,
                'toilet_type' => 1, 'water_source' => 1, 'food_production_activity' => 'PL',
                'couple_practicing_family_planning' => true, 'using_iodized_salt' => true, 'using_iron_fortified_rice' => true,
                'members' => [
                    ['role' => 'father', 'name' => 'Armando Cruz', 'occupation' => '5', 'educational_attainment' => 'HG', 'practicing_family_planning' => true],
                    ['role' => 'mother', 'name' => 'Imelda Cruz', 'occupation' => '11', 'educational_attainment' => 'EG', 'practicing_family_planning' => true],
                ],
            ],
            [
                'purok_sito' => 'Purok 3', 'barangay' => 'Poblacion Dos', 'municipality_city' => 'Cabuyao', 'province' => 'Laguna',
                'household_number' => 'HH-POB2-012', 'family_living_in_house' => 1, 'number_of_members' => 9,
                'nhts_household_group' => '2', 'indigenous_group' => '2',
                'newborn_male' => 0, 'newborn_female' => 0, 'infant_male' => 0, 'infant_female' => 0,
                'under_five_male' => 1, 'under_five_female' => 1, 'children_male' => 2, 'children_female' => 1,
                'adolescence_male' => 1, 'adolescence_female' => 0, 'pregnant' => 0, 'adolescent_pregnant' => 0,
                'post_partum' => 0, 'women_15_49_not_pregnant' => 1, 'adult_male' => 1, 'adult_female' => 1,
                'senior_citizen_male' => 1, 'senior_citizen_female' => 0, 'pwd_male' => 1, 'pwd_female' => 0,
                'toilet_type' => 2, 'water_source' => 1, 'food_production_activity' => 'VG',
                'couple_practicing_family_planning' => false, 'using_iodized_salt' => true, 'using_iron_fortified_rice' => true,
                'members' => [
                    ['role' => 'father', 'name' => 'Ricardo Ong', 'occupation' => '1', 'educational_attainment' => 'PG', 'practicing_family_planning' => false],
                    ['role' => 'mother', 'name' => 'Patricia Ong', 'occupation' => '2', 'educational_attainment' => 'CG', 'practicing_family_planning' => false],
                    ['role' => 'caregiver', 'name' => 'Yaya Nita', 'occupation' => '9', 'educational_attainment' => 'EU', 'practicing_family_planning' => false],
                ],
            ],
            [
                'purok_sito' => 'Block A', 'barangay' => 'Poblacion Tres', 'municipality_city' => 'Cabuyao', 'province' => 'Laguna',
                'household_number' => 'HH-POB3-013', 'family_living_in_house' => 1, 'number_of_members' => 3,
                'nhts_household_group' => '3', 'indigenous_group' => '2',
                'newborn_male' => 0, 'newborn_female' => 0, 'infant_male' => 0, 'infant_female' => 0,
                'under_five_male' => 0, 'under_five_female' => 0, 'children_male' => 0, 'children_female' => 0,
                'adolescence_male' => 1, 'adolescence_female' => 0, 'pregnant' => 0, 'adolescent_pregnant' => 0,
                'post_partum' => 0, 'women_15_49_not_pregnant' => 0, 'adult_male' => 1, 'adult_female' => 1,
                'senior_citizen_male' => 0, 'senior_citizen_female' => 0, 'pwd_male' => 0, 'pwd_female' => 0,
                'toilet_type' => 1, 'water_source' => 1, 'food_production_activity' => 'NA',
                'couple_practicing_family_planning' => true, 'using_iodized_salt' => true, 'using_iron_fortified_rice' => true,
                'members' => [
                    ['role' => 'father', 'name' => 'Fernando Tan', 'occupation' => '2', 'educational_attainment' => 'CG', 'practicing_family_planning' => true],
                    ['role' => 'mother', 'name' => 'Melody Tan', 'occupation' => '4', 'educational_attainment' => 'CG', 'practicing_family_planning' => true],
                ],
            ],
            [
                'purok_sito' => 'Purok 4', 'barangay' => 'Baclaran', 'municipality_city' => 'Cabuyao', 'province' => 'Laguna',
                'household_number' => 'HH-BAC-014', 'family_living_in_house' => 1, 'number_of_members' => 5,
                'nhts_household_group' => '2', 'indigenous_group' => '2',
                'newborn_male' => 0, 'newborn_female' => 0, 'infant_male' => 0, 'infant_female' => 0,
                'under_five_male' => 1, 'under_five_female' => 0, 'children_male' => 1, 'children_female' => 0,
                'adolescence_male' => 0, 'adolescence_female' => 1, 'pregnant' => 0, 'adolescent_pregnant' => 1,
                'post_partum' => 0, 'women_15_49_not_pregnant' => 0, 'adult_male' => 1, 'adult_female' => 1,
                'senior_citizen_male' => 0, 'senior_citizen_female' => 0, 'pwd_male' => 0, 'pwd_female' => 0,
                'toilet_type' => 3, 'water_source' => 2, 'food_production_activity' => 'NA',
                'couple_practicing_family_planning' => false, 'using_iodized_salt' => false, 'using_iron_fortified_rice' => false,
                'members' => [
                    ['role' => 'father', 'name' => 'Domingo Bautista', 'occupation' => '9', 'educational_attainment' => 'EU', 'practicing_family_planning' => false],
                    ['role' => 'mother', 'name' => 'Felicia Bautista', 'occupation' => '11', 'educational_attainment' => 'N', 'practicing_family_planning' => false],
                ],
            ],
            [
                'purok_sito' => 'Purok 2', 'barangay' => 'Banlic', 'municipality_city' => 'Cabuyao', 'province' => 'Laguna',
                'household_number' => 'HH-BAN-015', 'family_living_in_house' => 1, 'number_of_members' => 7,
                'nhts_household_group' => '1', 'indigenous_group' => '2',
                'newborn_male' => 0, 'newborn_female' => 0, 'infant_male' => 0, 'infant_female' => 1,
                'under_five_male' => 1, 'under_five_female' => 0, 'children_male' => 1, 'children_female' => 1,
                'adolescence_male' => 0, 'adolescence_female' => 0, 'pregnant' => 0, 'adolescent_pregnant' => 0,
                'post_partum' => 0, 'women_15_49_not_pregnant' => 1, 'adult_male' => 1, 'adult_female' => 1,
                'senior_citizen_male' => 1, 'senior_citizen_female' => 0, 'pwd_male' => 0, 'pwd_female' => 0,
                'toilet_type' => 1, 'water_source' => 1, 'food_production_activity' => 'FP',
                'couple_practicing_family_planning' => true, 'using_iodized_salt' => true, 'using_iron_fortified_rice' => true,
                'members' => [
                    ['role' => 'father', 'name' => 'Alberto Morales', 'occupation' => '6', 'educational_attainment' => 'HG', 'practicing_family_planning' => true],
                    ['role' => 'mother', 'name' => 'Vilma Morales', 'occupation' => '11', 'educational_attainment' => 'EG', 'practicing_family_planning' => true],
                ],
            ],
            [
                'purok_sito' => 'Purok 1', 'barangay' => 'Casile', 'municipality_city' => 'Cabuyao', 'province' => 'Laguna',
                'household_number' => 'HH-CAS-016', 'family_living_in_house' => 1, 'number_of_members' => 4,
                'nhts_household_group' => '2', 'indigenous_group' => '2',
                'newborn_male' => 0, 'newborn_female' => 0, 'infant_male' => 0, 'infant_female' => 0,
                'under_five_male' => 0, 'under_five_female' => 0, 'children_male' => 2, 'children_female' => 0,
                'adolescence_male' => 0, 'adolescence_female' => 0, 'pregnant' => 0, 'adolescent_pregnant' => 0,
                'post_partum' => 0, 'women_15_49_not_pregnant' => 1, 'adult_male' => 1, 'adult_female' => 1,
                'senior_citizen_male' => 0, 'senior_citizen_female' => 0, 'pwd_male' => 0, 'pwd_female' => 0,
                'toilet_type' => 1, 'water_source' => 1, 'food_production_activity' => 'VG',
                'couple_practicing_family_planning' => true, 'using_iodized_salt' => true, 'using_iron_fortified_rice' => true,
                'members' => [
                    ['role' => 'father', 'name' => 'Roberto Castillo', 'occupation' => '7', 'educational_attainment' => 'V', 'practicing_family_planning' => true],
                    ['role' => 'mother', 'name' => 'Grace Castillo', 'occupation' => '11', 'educational_attainment' => 'HU', 'practicing_family_planning' => true],
                ],
            ],
            [
                'purok_sito' => 'Purok 5', 'barangay' => 'Pulo', 'municipality_city' => 'Cabuyao', 'province' => 'Laguna',
                'household_number' => 'HH-PUL-017', 'family_living_in_house' => 1, 'number_of_members' => 6,
                'nhts_household_group' => '1', 'indigenous_group' => '2',
                'newborn_male' => 1, 'newborn_female' => 0, 'infant_male' => 0, 'infant_female' => 0,
                'under_five_male' => 0, 'under_five_female' => 1, 'children_male' => 1, 'children_female' => 0,
                'adolescence_male' => 0, 'adolescence_female' => 0, 'pregnant' => 0, 'adolescent_pregnant' => 0,
                'post_partum' => 1, 'women_15_49_not_pregnant' => 0, 'adult_male' => 1, 'adult_female' => 1,
                'senior_citizen_male' => 0, 'senior_citizen_female' => 1, 'pwd_male' => 0, 'pwd_female' => 0,
                'toilet_type' => 1, 'water_source' => 1, 'food_production_activity' => 'PL',
                'couple_practicing_family_planning' => true, 'using_iodized_salt' => true, 'using_iron_fortified_rice' => true,
                'members' => [
                    ['role' => 'father', 'name' => 'Emmanuel Diaz', 'occupation' => '5', 'educational_attainment' => 'CU', 'practicing_family_planning' => true],
                    ['role' => 'mother', 'name' => 'Susan Diaz', 'occupation' => '11', 'educational_attainment' => 'HG', 'practicing_family_planning' => true],
                ],
            ],
            [
                'purok_sito' => 'Block B', 'barangay' => 'Sala', 'municipality_city' => 'Cabuyao', 'province' => 'Laguna',
                'household_number' => 'HH-SAL-018', 'family_living_in_house' => 1, 'number_of_members' => 8,
                'nhts_household_group' => '2', 'indigenous_group' => '2',
                'newborn_male' => 0, 'newborn_female' => 0, 'infant_male' => 0, 'infant_female' => 0,
                'under_five_male' => 2, 'under_five_female' => 0, 'children_male' => 1, 'children_female' => 1,
                'adolescence_male' => 0, 'adolescence_female' => 0, 'pregnant' => 0, 'adolescent_pregnant' => 0,
                'post_partum' => 0, 'women_15_49_not_pregnant' => 1, 'adult_male' => 2, 'adult_female' => 1,
                'senior_citizen_male' => 1, 'senior_citizen_female' => 0, 'pwd_male' => 0, 'pwd_female' => 0,
                'toilet_type' => 1, 'water_source' => 1, 'food_production_activity' => 'VG',
                'couple_practicing_family_planning' => false, 'using_iodized_salt' => true, 'using_iron_fortified_rice' => true,
                'members' => [
                    ['role' => 'father', 'name' => 'Romeo Aguilar', 'occupation' => '6', 'educational_attainment' => 'EG', 'practicing_family_planning' => false],
                    ['role' => 'mother', 'name' => 'Julie Aguilar', 'occupation' => '11', 'educational_attainment' => 'EG', 'practicing_family_planning' => false],
                    ['role' => 'caregiver', 'name' => 'Lolo Tibo', 'occupation' => '11', 'educational_attainment' => 'N', 'practicing_family_planning' => false],
                ],
            ],
            [
                'purok_sito' => 'Purok 3', 'barangay' => 'San Isidro', 'municipality_city' => 'Cabuyao', 'province' => 'Laguna',
                'household_number' => 'HH-SID-019', 'family_living_in_house' => 1, 'number_of_members' => 3,
                'nhts_household_group' => '3', 'indigenous_group' => '2',
                'newborn_male' => 0, 'newborn_female' => 0, 'infant_male' => 0, 'infant_female' => 0,
                'under_five_male' => 0, 'under_five_female' => 0, 'children_male' => 0, 'children_female' => 0,
                'adolescence_male' => 0, 'adolescence_female' => 0, 'pregnant' => 0, 'adolescent_pregnant' => 0,
                'post_partum' => 0, 'women_15_49_not_pregnant' => 1, 'adult_male' => 1, 'adult_female' => 1,
                'senior_citizen_male' => 0, 'senior_citizen_female' => 0, 'pwd_male' => 0, 'pwd_female' => 0,
                'toilet_type' => 1, 'water_source' => 1, 'food_production_activity' => 'NA',
                'couple_practicing_family_planning' => true, 'using_iodized_salt' => true, 'using_iron_fortified_rice' => true,
                'members' => [
                    ['role' => 'father', 'name' => 'Renato Navarro', 'occupation' => '4', 'educational_attainment' => 'CG', 'practicing_family_planning' => true],
                    ['role' => 'mother', 'name' => 'Mila Navarro', 'occupation' => '5', 'educational_attainment' => 'HG', 'practicing_family_planning' => true],
                ],
            ],
            [
                'purok_sito' => 'Purok 4', 'barangay' => 'Diezmo', 'municipality_city' => 'Cabuyao', 'province' => 'Laguna',
                'household_number' => 'HH-DIE-020', 'family_living_in_house' => 1, 'number_of_members' => 5,
                'nhts_household_group' => '1', 'indigenous_group' => '2',
                'newborn_male' => 0, 'newborn_female' => 0, 'infant_male' => 0, 'infant_female' => 0,
                'under_five_male' => 0, 'under_five_female' => 0, 'children_male' => 2, 'children_female' => 0,
                'adolescence_male' => 1, 'adolescence_female' => 0, 'pregnant' => 0, 'adolescent_pregnant' => 0,
                'post_partum' => 0, 'women_15_49_not_pregnant' => 1, 'adult_male' => 1, 'adult_female' => 1,
                'senior_citizen_male' => 0, 'senior_citizen_female' => 0, 'pwd_male' => 0, 'pwd_female' => 0,
                'toilet_type' => 1, 'water_source' => 1, 'food_production_activity' => 'FT',
                'couple_practicing_family_planning' => true, 'using_iodized_salt' => true, 'using_iron_fortified_rice' => true,
                'members' => [
                    ['role' => 'father', 'name' => 'Victor Espinoza', 'occupation' => '3', 'educational_attainment' => 'CG', 'practicing_family_planning' => true],
                    ['role' => 'mother', 'name' => 'Ruby Espinoza', 'occupation' => '11', 'educational_attainment' => 'HG', 'practicing_family_planning' => true],
                ],
            ],
        ];

        foreach ($households as $data) {
            $members = $data['members'] ?? [];
            unset($data['members']);
            $h = Household::create($data);
            foreach ($members as $m) {
                $h->members()->create($m);
            }
        }
    }
}
