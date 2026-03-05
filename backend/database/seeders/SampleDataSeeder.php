<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class SampleDataSeeder extends Seeder
{
    /**
     * Seed ~5,000 sample household records distributed across 13 barangays.
     * Household numbers restart from 1 for each barangay.
     * Unique key: (household_number, barangay, purok_sitio)
     */
    public function run(): void
    {
        // ─── Config ──────────────────────────────────────────────────────────
        $municipality = 'Cabuyao';
        $province     = 'Laguna';

        // Barangay => [ [purok/sitio label, count], … ]  (total ≈ 5 000 HHs)
        $barangays = [
            'Baclaran'   => [
                ['Sitio 1', 100], ['Sitio 2', 100], ['Sitio 3', 100],
                ['Sitio 4', 100], ['Sitio 5', 100],
            ],
            'Banay-Banay' => [
                ['Purok 1', 80], ['Purok 2', 80], ['Purok 3', 80],
                ['Purok 4', 80], ['Purok 5', 80],
            ],
            'Banlic' => [
                ['Purok 1', 90], ['Purok 2', 90], ['Purok 3', 90],
                ['Purok 4', 90], ['Purok 5', 90],
            ],
            'Bigaa' => [
                ['Sitio 1', 100], ['Sitio 2', 100], ['Sitio 3', 100],
                ['Sitio 4', 100],
            ],
            'Butong' => [
                ['Purok 1', 80], ['Purok 2', 80], ['Purok 3', 80],
                ['Purok 4', 80],
            ],
            'Casile' => [
                ['Purok 1', 70], ['Purok 2', 70], ['Purok 3', 70],
                ['Purok 4', 70],
            ],
            'Diezmo' => [
                ['Sitio 1', 80], ['Sitio 2', 80], ['Sitio 3', 80],
                ['Sitio 4', 80],
            ],
            'Pulo' => [
                ['Purok 1', 100], ['Purok 2', 100], ['Purok 3', 100],
                ['Purok 4', 100],
            ],
            'Sala' => [
                ['Purok 1', 90], ['Purok 2', 90], ['Purok 3', 90],
                ['Purok 4', 90],
            ],
            'San Isidro' => [
                ['Sitio 1', 80], ['Sitio 2', 80], ['Sitio 3', 80],
                ['Sitio 4', 80],
            ],
            'Pob. Uno' => [
                ['Purok 1', 70], ['Purok 2', 70], ['Purok 3', 70],
                ['Purok 4', 70],
            ],
            'Pob. Dos' => [
                ['Purok 1', 70], ['Purok 2', 70], ['Purok 3', 70],
                ['Purok 4', 70],
            ],
            'Pob. Tres' => [
                ['Purok 1', 70], ['Purok 2', 70], ['Purok 3', 70],
                ['Purok 4', 70],
            ],
        ];

        // ─── Lookup tables ────────────────────────────────────────────────────
        $nhtsGroups        = ['1', '2', '3'];
        $indigenousGroups  = ['1', '2'];
        $toiletTypes       = [1, 1, 1, 2, 3, 4];  // weighted toward improved
        $waterSources      = [1, 1, 1, 2];
        $foodActivities    = ['VG', 'FT', 'PL', 'FP', 'NA', 'NA'];
        $occupations       = ['1','2','3','4','5','6','7','8','9','10','11'];
        $educations        = ['N','EU','EG','HU','HG','CU','CG','V','PG'];
        $roles             = ['father', 'mother', 'caregiver'];

        $filipinoFirstNames = [
            'Juan','Maria','Jose','Ana','Pedro','Carmen','Luis','Rosa',
            'Antonio','Luz','Eduardo','Elena','Ricardo','Natividad',
            'Fernando','Corazon','Manuel','Esperanza','Carlos','Rosario',
            'Roberto','Marilou','Danilo','Maricel','Rommel','Rowena',
            'Renato','Teresita','Ernesto','Zenaida','Allan','Glenda',
            'Ariel','Jennifer','Benedict','Sheila','Mark','Jasmine',
            'Ryan','Christine','Joel','Josefa','Dennis','Analiza',
        ];
        $filipinoLastNames = [
            'Santos','Reyes','Cruz','Garcia','Dela Cruz','Ramos',
            'Mendoza','Torres','Bautista','Aquino','Villanueva','Castillo',
            'Gonzales','Lopez','Flores','Navarro','Aguilar','Morales',
            'Romero','Salazar','Domingo','Buenaventura','Magpantay',
            'Tolentino','Esguerra','Macaraeg','Baluyot','Delos Reyes',
            'Manalo','Ocampo','Vergara','Pascual','Dizon','Perez',
            'Bernardo','Cabrera','Guerrero','Dela Peña','Sanchez',
        ];

        $bnsNames = [
            'Maria Santos','Elena Reyes','Rosa Cruz','Luz Garcia',
            'Carmen Dela Cruz','Corazon Ramos','Zenaida Mendoza',
            'Glenda Torres','Maricel Bautista','Rowena Aquino',
            'Teresita Villanueva','Josefa Castillo','Analiza Gonzales',
        ];

        $now = now();

        // ─── Helper closures ──────────────────────────────────────────────────
        $rand  = fn(array $arr) => $arr[array_rand($arr)];
        $rng   = fn(int $min, int $max) => rand($min, $max);
        $name  = fn() => $filipinoFirstNames[array_rand($filipinoFirstNames)]
                         . ' '
                         . $filipinoLastNames[array_rand($filipinoLastNames)];

        // ─── Seeding ──────────────────────────────────────────────────────────
        $barangayIndex = 0;

        foreach ($barangays as $barangay => $puroks) {
            $bns        = $bnsNames[$barangayIndex % count($bnsNames)];
            $hhCounter  = 1;   // resets to 1 for every barangay

            foreach ($puroks as [$purok, $count]) {
                $householdsChunk  = [];
                $membersChunk     = [];

                for ($i = 0; $i < $count; $i++) {
                    $hhNo        = (string) $hhCounter;
                    $hhCounter++;

                    // Age-group counts
                    $newbornM    = $rng(0, 1);
                    $newbornF    = $rng(0, 1);
                    $infantM     = $rng(0, 1);
                    $infantF     = $rng(0, 1);
                    $uf_m        = $rng(0, 2);
                    $uf_f        = $rng(0, 2);
                    $ch_m        = $rng(0, 2);
                    $ch_f        = $rng(0, 2);
                    $adol_m      = $rng(0, 2);
                    $adol_f      = $rng(0, 2);
                    $pregnant    = $rng(0, 1);
                    $adolPreg    = $rng(0, 1);
                    $postPartum  = $rng(0, 1);
                    $wom1549     = $rng(0, 2);
                    $adultM      = $rng(1, 3);
                    $adultF      = $rng(1, 3);
                    $seniorM     = $rng(0, 1);
                    $seniorF     = $rng(0, 1);
                    $pwdM        = $rng(0, 1);
                    $pwdF        = $rng(0, 1);

                    $totalMembers = $newbornM + $newbornF + $infantM + $infantF
                        + $uf_m + $uf_f + $ch_m + $ch_f
                        + $adol_m + $adol_f + $pregnant + $adolPreg
                        + $postPartum + $wom1549 + $adultM + $adultF
                        + $seniorM + $seniorF + $pwdM + $pwdF;

                    $familyPlan  = $rng(0, 1) === 1;
                    $iodized     = $rng(0, 1) === 1;
                    $ironRice    = $rng(0, 1) === 1;

                    $householdsChunk[] = [
                        'purok_sito'                       => $purok,
                        'barangay'                         => $barangay,
                        'municipality_city'                => $municipality,
                        'province'                         => $province,
                        'household_number'                 => $hhNo,
                        'family_living_in_house'           => $rng(1, 3),
                        'number_of_members'                => max(1, $totalMembers),
                        'nhts_household_group'             => $rand($nhtsGroups),
                        'indigenous_group'                 => $rand($indigenousGroups),
                        'newborn_male'                     => $newbornM,
                        'newborn_female'                   => $newbornF,
                        'infant_male'                      => $infantM,
                        'infant_female'                    => $infantF,
                        'under_five_male'                  => $uf_m,
                        'under_five_female'                => $uf_f,
                        'children_male'                    => $ch_m,
                        'children_female'                  => $ch_f,
                        'adolescence_male'                 => $adol_m,
                        'adolescence_female'               => $adol_f,
                        'pregnant'                         => $pregnant,
                        'adolescent_pregnant'              => $adolPreg,
                        'post_partum'                      => $postPartum,
                        'women_15_49_not_pregnant'         => $wom1549,
                        'adult_male'                       => $adultM,
                        'adult_female'                     => $adultF,
                        'senior_citizen_male'              => $seniorM,
                        'senior_citizen_female'            => $seniorF,
                        'pwd_male'                         => $pwdM,
                        'pwd_female'                       => $pwdF,
                        'toilet_type'                      => $rand($toiletTypes),
                        'water_source'                     => $rand($waterSources),
                        'food_production_activity'         => $rand($foodActivities),
                        'couple_practicing_family_planning' => $familyPlan,
                        'using_iodized_salt'               => $iodized,
                        'using_iron_fortified_rice'        => $ironRice,
                        'created_at'                       => $now,
                        'updated_at'                       => $now,
                    ];
                }

                // Insert households in chunks, collect IDs
                DB::table('households')->insert($householdsChunk);

                // Fetch inserted IDs for this batch (same barangay + purok range)
                $insertedIds = DB::table('households')
                    ->where('barangay', $barangay)
                    ->where('purok_sito', $purok)
                    ->orderBy('id')
                    ->pluck('id')
                    ->toArray();

                foreach ($insertedIds as $hhId) {
                    // Father
                    $membersChunk[] = [
                        'household_id'             => $hhId,
                        'name'                     => $name(),
                        'role'                     => 'father',
                        'occupation'               => $rand($occupations),
                        'educational_attainment'   => $rand($educations),
                        'practicing_family_planning' => $rng(0, 1) === 1,
                        'created_at'               => $now,
                        'updated_at'               => $now,
                    ];
                    // Mother
                    $membersChunk[] = [
                        'household_id'             => $hhId,
                        'name'                     => $name(),
                        'role'                     => 'mother',
                        'occupation'               => $rand($occupations),
                        'educational_attainment'   => $rand($educations),
                        'practicing_family_planning' => $rng(0, 1) === 1,
                        'created_at'               => $now,
                        'updated_at'               => $now,
                    ];
                    // ~40% also have a caregiver
                    if ($rng(0, 9) < 4) {
                        $membersChunk[] = [
                            'household_id'             => $hhId,
                            'name'                     => $name(),
                            'role'                     => 'caregiver',
                            'occupation'               => $rand($occupations),
                            'educational_attainment'   => $rand($educations),
                            'practicing_family_planning' => false,
                            'created_at'               => $now,
                            'updated_at'               => $now,
                        ];
                    }
                }

                // Insert members in chunks of 500
                foreach (array_chunk($membersChunk, 500) as $chunk) {
                    DB::table('household_members')->insert($chunk);
                }

                $membersChunk = [];
            }

            $barangayIndex++;
        }

        $this->command->info('SampleDataSeeder: household records inserted successfully.');
    }
}
