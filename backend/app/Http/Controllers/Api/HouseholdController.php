<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreHouseholdRequest;
use App\Http\Requests\UpdateHouseholdRequest;
use App\Models\Household;
use App\Models\HouseholdMember;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class HouseholdController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Household::with('members');

        // Search filters (household fields + member names)
        if ($request->has('search') && trim((string) $request->get('search')) !== '') {
            $search = trim((string) $request->get('search'));
            $query->where(function ($q) use ($search) {
                $q->where('household_number', 'like', "%{$search}%")
                  ->orWhere('barangay', 'like', "%{$search}%")
                  ->orWhere('municipality_city', 'like', "%{$search}%")
                  ->orWhere('province', 'like', "%{$search}%")
                  ->orWhere('purok_sito', 'like', "%{$search}%")
                  ->orWhereHas('members', function ($mq) use ($search) {
                      $mq->where('name', 'like', "%{$search}%");
                  });
            });
        }

        // Filter by location
        if ($request->has('province')) {
            $query->where('province', $request->get('province'));
        }
        if ($request->has('municipality_city')) {
            $query->where('municipality_city', $request->get('municipality_city'));
        }
        if ($request->has('barangay') && trim((string) $request->get('barangay')) !== '') {
            $query->where('barangay', $request->get('barangay'));
        }

        // BNS filter — search by barangay nutrition scholar name (member name)
        if ($request->has('bns') && trim((string) $request->get('bns')) !== '') {
            $bns = trim((string) $request->get('bns'));
            $query->whereHas('members', function ($mq) use ($bns) {
                $mq->where('name', 'like', "%{$bns}%");
            });
        }

        // Purok / Block / Street filter
        if ($request->has('purok_sito') && trim((string) $request->get('purok_sito')) !== '') {
            $query->where('purok_sito', 'like', '%' . trim($request->get('purok_sito')) . '%');
        }

        // Survey year filter (year of created_at)
        if ($request->has('survey_year') && is_numeric($request->get('survey_year'))) {
            $query->whereYear('created_at', (int) $request->get('survey_year'));
        }

        // Period From / Period To (created_at date range)
        if ($request->has('period_from') && $request->get('period_from')) {
            $query->whereDate('created_at', '>=', $request->get('period_from'));
        }
        if ($request->has('period_to') && $request->get('period_to')) {
            $query->whereDate('created_at', '<=', $request->get('period_to'));
        }

        // Pagination
        $perPage = $request->get('per_page', 15);
        $households = $query->orderBy('created_at', 'desc')->paginate($perPage);

        return response()->json($households);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreHouseholdRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $members = $validated['members'] ?? [];
        unset($validated['members']);

        $household = Household::create($validated);

        // Create household members
        foreach ($members as $memberData) {
            $household->members()->create($memberData);
        }

        $household->load('members');

        return response()->json([
            'message' => 'Household created successfully',
            'data' => $household,
        ], 201);
    }

    public function show(string $id): JsonResponse
    {
        $household = Household::with('members')->findOrFail($id);

        $relatedFamilies = Household::with('members')
            ->where('household_number', $household->household_number)
            ->where('barangay', $household->barangay)
            ->where('purok_sito', $household->purok_sito)
            ->where('id', '!=', $household->id)
            ->orderBy('family_living_in_house')
            ->get();

        $data = $household->toArray();
        $data['related_families'] = $relatedFamilies;

        return response()->json($data);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateHouseholdRequest $request, string $id): JsonResponse
    {
        $household = Household::findOrFail($id);
        $validated = $request->validated();
        $members = $validated['members'] ?? [];
        unset($validated['members']);

        $household->update($validated);

        // Update or create household members
        if (!empty($members)) {
            $existingMemberIds = [];
            
            foreach ($members as $memberData) {
                if (isset($memberData['id'])) {
                    // Update existing member
                    $member = HouseholdMember::where('id', $memberData['id'])
                        ->where('household_id', $household->id)
                        ->first();
                    
                    if ($member) {
                        unset($memberData['id']);
                        $member->update($memberData);
                        $existingMemberIds[] = $member->id;
                    }
                } else {
                    // Create new member
                    $newMember = $household->members()->create($memberData);
                    $existingMemberIds[] = $newMember->id;
                }
            }

            // Delete members that are not in the request
            $household->members()->whereNotIn('id', $existingMemberIds)->delete();
        }

        $household->load('members');

        return response()->json([
            'message' => 'Household updated successfully',
            'data' => $household,
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id): JsonResponse
    {
        $household = Household::findOrFail($id);
        $household->delete();

        return response()->json([
            'message' => 'Household deleted successfully',
        ]);
    }

    /**
     * Check if household_number + barangay already exists (duplicate check).
     * GET /api/households/check-duplicate?household_number=...&barangay=...&exclude_id=... (optional)
     */
    public function checkDuplicate(Request $request): JsonResponse
    {
        $request->validate([
            'household_number' => 'required|string|max:255',
            'barangay' => 'nullable|string|max:255',
            'purok_sito' => 'nullable|string|max:255',
            'exclude_id' => 'nullable|integer|exists:households,id',
        ]);

        $query = Household::where('household_number', $request->household_number)
            ->where('barangay', $request->get('barangay', ''))
            ->where('purok_sito', $request->get('purok_sito', ''))
            ->where('family_living_in_house', $request->get('family_living_in_house', ''));

        if ($request->has('exclude_id')) {
            $query->where('id', '!=', $request->exclude_id);
        }

        $exists = $query->exists();

        return response()->json([
            'duplicate' => $exists,
            'message' => $exists ? 'A household with this HH No. already exists in this barangay and purok/sitio.' : null,
        ]);
    }

    /**
     * Import households from Excel/CSV file or JSON data.
     */
    public function import(Request $request): JsonResponse
    {
        $successful = 0;
        $failed = 0;
        $skipped = 0;
        $errors = [];
        $skippedLogs = [];

        try {
            // Check if request contains JSON data (from frontend Excel parsing)
            if ($request->has('households') && is_array($request->households)) {
                $households = $request->households;
                
                foreach ($households as $index => $householdData) {
                    try {
                        // Extract members from household data
                        $members = $householdData['members'] ?? [];
                        unset($householdData['members']);

                        // Normalize key text inputs before validation/checks
                        foreach (['household_number', 'purok_sito', 'barangay', 'municipality_city', 'province'] as $key) {
                            if (isset($householdData[$key]) && is_string($householdData[$key])) {
                                $householdData[$key] = trim($householdData[$key]);
                            }
                        }

                        // Validate and create household
                        $validator = \Validator::make($householdData, [
                            'household_number' => 'required|string|max:255',
                            'purok_sito' => 'required|string|max:255',
                            'barangay' => 'required|string|max:255',
                            'municipality_city' => 'nullable|string|max:255',
                            'province' => 'nullable|string|max:255',
                            'family_living_in_house' => 'nullable|string|max:255',
                            'number_of_members' => 'nullable|integer|min:0',
                            'nhts_household_group' => 'nullable|string|max:255',
                            'indigenous_group' => 'nullable|string|max:255',
                            'newborn_male' => 'nullable|integer|min:0',
                            'newborn_female' => 'nullable|integer|min:0',
                            'infant_male' => 'nullable|integer|min:0',
                            'infant_female' => 'nullable|integer|min:0',
                            'under_five_male' => 'nullable|integer|min:0',
                            'under_five_female' => 'nullable|integer|min:0',
                            'children_male' => 'nullable|integer|min:0',
                            'children_female' => 'nullable|integer|min:0',
                            'adolescence_male' => 'nullable|integer|min:0',
                            'adolescence_female' => 'nullable|integer|min:0',
                            'pregnant' => 'nullable|integer|min:0',
                            'adolescent_pregnant' => 'nullable|integer|min:0',
                            'post_partum' => 'nullable|integer|min:0',
                            'women_15_49_not_pregnant' => 'nullable|integer|min:0',
                            'adult_male' => 'nullable|integer|min:0',
                            'adult_female' => 'nullable|integer|min:0',
                            'senior_citizen_male' => 'nullable|integer|min:0',
                            'senior_citizen_female' => 'nullable|integer|min:0',
                            'pwd_male' => 'nullable|integer|min:0',
                            'pwd_female' => 'nullable|integer|min:0',
                            'toilet_type' => 'nullable|string|max:255',
                            'water_source' => 'nullable|string|max:255',
                            'food_production_activity' => 'nullable|string|max:255',
                            'couple_practicing_family_planning' => 'nullable|boolean',
                            'using_iodized_salt' => 'nullable|boolean',
                            'using_iron_fortified_rice' => 'nullable|boolean',
                        ]);

                        if ($validator->fails()) {
                            $failed++;
                            $errors[] = "Row " . ($index + 1) . ": " . $validator->errors()->first();
                            continue;
                        }

                        $validated = $validator->validated();

                        // Check duplicate: same household_number + barangay + purok_sito
                        $barangay = $validated['barangay'] ?? '';
                        $purokSito = $validated['purok_sito'] ?? '';
                        $existing = Household::where('household_number', $validated['household_number'])
                            ->where('barangay', $barangay)
                            ->where('purok_sito', $purokSito)
                            ->where('family_living_in_house', $validated['family_living_in_house'] ?? '')
                            ->first();
                        if ($existing) {
                            $forceUpdate = isset($householdData['force_update']) && $householdData['force_update'];
                            if ($forceUpdate) {
                                // Update existing household with new data
                                $existing->update($validated);
                                // Sync members: delete old, add new
                                $existing->members()->delete();
                                foreach ($members as $memberData) {
                                    if (!empty($memberData['name']) || !empty($memberData['occupation']) || !empty($memberData['educational_attainment'])) {
                                        $existing->members()->create([
                                            'role'                   => $memberData['role'] ?? null,
                                            'name'                   => $memberData['name'] ?? null,
                                            'occupation'             => $memberData['occupation'] ?? null,
                                            'educational_attainment' => $memberData['educational_attainment'] ?? null,
                                            'practicing_family_planning' => $memberData['practicing_family_planning'] ?? false,
                                        ]);
                                    }
                                }
                                $successful++;
                            } else {
                                $skipped++;
                                $skippedLogs[] = "Row " . ($index + 1) . ": Duplicate skipped (HH No. '{$validated['household_number']}', Barangay '{$barangay}', Purok/Sitio '{$purokSito}', Family '{$validated['family_living_in_house']}')";
                            }
                            continue;
                        }

                        // Create household
                        $household = Household::create($validated);

                        // Create household members
                        foreach ($members as $memberData) {
                            if (!empty($memberData['name']) || !empty($memberData['occupation']) || !empty($memberData['educational_attainment'])) {
                                $household->members()->create([
                                    'role' => $memberData['role'] ?? null,
                                    'name' => $memberData['name'] ?? null,
                                    'occupation' => $memberData['occupation'] ?? null,
                                    'educational_attainment' => $memberData['educational_attainment'] ?? null,
                                    'practicing_family_planning' => $memberData['practicing_family_planning'] ?? false,
                                ]);
                            }
                        }

                        $successful++;
                    } catch (\Exception $e) {
                        $failed++;
                        $errors[] = "Row " . ($index + 1) . ": " . $e->getMessage();
                    }
                }
            } else {
                // Handle file upload (CSV or future Excel file handling)
                return response()->json([
                    'message' => 'Please use the Excel format (BNS Form) for importing data.',
                    'error' => 'File upload not yet supported. Please use the BNS Form Excel format.',
                ], 400);
            }

            return response()->json([
                'message' => "Import completed. {$successful} successful, {$failed} failed, {$skipped} skipped duplicates.",
                'stats' => [
                    'total' => count($request->households ?? []),
                    'successful' => $successful,
                    'failed' => $failed,
                    'skipped' => $skipped,
                ],
                'errors' => $errors,
                'skipped_logs' => $skippedLogs,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error importing data: ' . $e->getMessage(),
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Preview which households are new, unchanged, or changed before a real import.
     * POST /api/households/preview-import
     */
    public function previewImport(Request $request): JsonResponse
    {
        if (!$request->has('households') || !is_array($request->households)) {
            return response()->json(['message' => 'No households data provided.'], 400);
        }

        $fieldLabels = [
            'family_living_in_house'       => 'Family Living in House',
            'number_of_members'            => 'Number of Members',
            'nhts_household_group'         => 'NHTS Household Group',
            'indigenous_group'             => 'Indigenous Group',
            'newborn_male'                 => 'Newborn (Male)',
            'newborn_female'               => 'Newborn (Female)',
            'infant_male'                  => 'Infant (Male)',
            'infant_female'                => 'Infant (Female)',
            'under_five_male'              => 'Under 5 (Male)',
            'under_five_female'            => 'Under 5 (Female)',
            'children_male'               => 'Children (Male)',
            'children_female'             => 'Children (Female)',
            'adolescence_male'             => 'Adolescence (Male)',
            'adolescence_female'           => 'Adolescence (Female)',
            'pregnant'                     => 'Pregnant',
            'adolescent_pregnant'          => 'Adolescent Pregnant',
            'post_partum'                  => 'Post Partum',
            'women_15_49_not_pregnant'     => 'Women 15-49 (Not Pregnant)',
            'adult_male'                   => 'Adult (Male)',
            'adult_female'                 => 'Adult (Female)',
            'senior_citizen_male'          => 'Senior Citizen (Male)',
            'senior_citizen_female'        => 'Senior Citizen (Female)',
            'pwd_male'                     => 'PWD (Male)',
            'pwd_female'                   => 'PWD (Female)',
            'couple_practicing_family_planning' => 'Couple Practicing FP',
            'toilet_type'                  => 'Toilet Type',
            'water_source'                 => 'Water Source',
            'food_production_activity'     => 'Food Production Activity',
            'using_iodized_salt'           => 'Using Iodized Salt',
            'using_iron_fortified_rice'    => 'Using Iron-Fortified Rice',
        ];

        $results = [];

        foreach ($request->households as $index => $householdData) {
            foreach (['household_number', 'purok_sito', 'barangay'] as $key) {
                if (isset($householdData[$key])) {
                    $householdData[$key] = trim((string) $householdData[$key]);
                }
            }

            $hhNumber  = $householdData['household_number'] ?? '';
            $barangay  = $householdData['barangay'] ?? '';
            $purokSito = $householdData['purok_sito'] ?? '';

            if (!$hhNumber) {
                $results[] = ['status' => 'new', 'index' => $index];
                continue;
            }

            $existing = Household::with('members')
                ->where('household_number', $hhNumber)
                ->where('barangay', $barangay)
                ->where('purok_sito', $purokSito)
                ->where('family_living_in_house', (string)($householdData['family_living_in_house'] ?? ''))
                ->first();

            if (!$existing) {
                $results[] = ['status' => 'new', 'index' => $index];
                continue;
            }

            // Compare fields
            $numericFields = [
                'number_of_members','newborn_male','newborn_female','infant_male','infant_female',
                'under_five_male','under_five_female','children_male','children_female',
                'adolescence_male','adolescence_female','pregnant','adolescent_pregnant',
                'post_partum','women_15_49_not_pregnant','adult_male','adult_female',
                'senior_citizen_male','senior_citizen_female','pwd_male','pwd_female',
            ];
            $booleanFields = ['couple_practicing_family_planning','using_iodized_salt','using_iron_fortified_rice'];

            $diffs = [];
            foreach ($fieldLabels as $field => $label) {
                $newVal = $householdData[$field] ?? null;
                $oldVal = $existing->$field;

                if (in_array($field, $booleanFields)) {
                    // Normalize booleans: null/0/false → false, 1/true → true
                    $oldNorm = filter_var($oldVal, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE) ?? false;
                    $newNorm = filter_var($newVal, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE) ?? false;
                    if ($oldNorm === $newNorm) continue;
                } elseif (in_array($field, $numericFields)) {
                    // Normalize numeric fields: null and 0 are treated as equivalent
                    $oldNorm = (int)($oldVal ?? 0);
                    $newNorm = (int)($newVal ?? 0);
                    if ($oldNorm === $newNorm) continue;
                } else {
                    // String fields: treat null and '' as equivalent
                    $oldNorm = trim((string)($oldVal ?? ''));
                    $newNorm = trim((string)($newVal ?? ''));
                    if ($oldNorm === $newNorm) continue;
                }

                $diffs[] = [
                    'field'    => $field,
                    'label'    => $label,
                    'oldValue' => $oldVal,
                    'newValue' => $newVal,
                ];
            }

            // Compare members (father, mother, caregiver names)
            $incomingMembers = $householdData['members'] ?? [];
            $existingMembers = $existing->members->keyBy('role');
            foreach (['father', 'mother', 'caregiver'] as $role) {
                $incomingMember = collect($incomingMembers)->firstWhere('role', $role);
                $existingMember = $existingMembers->get($role);
                $incomingName   = $incomingMember['name'] ?? '';
                $existingName   = $existingMember ? ($existingMember->name ?? '') : '';
                if (trim($incomingName) !== trim($existingName)) {
                    $label = ucfirst($role) . ' Name';
                    $diffs[] = [
                        'field'    => $role . '_name',
                        'label'    => $label,
                        'oldValue' => $existingName ?: null,
                        'newValue' => $incomingName ?: null,
                    ];
                }
            }

            if (empty($diffs)) {
                $results[] = ['status' => 'unchanged', 'index' => $index];
            } else {
                $results[] = [
                    'status'           => 'changed',
                    'index'            => $index,
                    'existingId'       => $existing->id,
                    'household_number'       => $hhNumber,
                    'barangay'               => $barangay,
                    'purok_sito'             => $purokSito,
                    'family_living_in_house' => $householdData['family_living_in_house'] ?? '',
                    'diffs'                  => $diffs,
                ];
            }
        }

        return response()->json(['preview' => $results]);
    }

    public function options(Request $request): JsonResponse
    {
        $years = \Illuminate\Support\Facades\DB::table('households')
            ->selectRaw("DISTINCT strftime('%Y', created_at) as year")
            ->whereNotNull('created_at')
            ->orderBy('year', 'desc')
            ->pluck('year')
            ->map(fn($y) => (string) $y)
            ->toArray();

        $puroks = \Illuminate\Support\Facades\DB::table('households')
            ->select('barangay', 'purok_sito')
            ->whereNotNull('purok_sito')
            ->where('purok_sito', '!=', '')
            ->distinct()
            ->get()
            ->groupBy('barangay')
            ->map(function ($items) {
                return $items->pluck('purok_sito')->sort()->values()->toArray();
            });

        return response()->json([
            'years' => empty($years) ? [date('Y')] : $years,
            'puroks' => $puroks
        ]);
    }

    public function dashboardStats(Request $request): JsonResponse
    {
        $allBarangays = [
            'Baclaran', 'Banay-Banay', 'Banlic', 'Bigaa', 'Butong', 'Casile',
            'Diezmo', 'Gulod', 'Mamatid', 'Marinig', 'Masiit', 'Niugan', 'Pittland',
            'Pulo', 'Sala', 'San Isidro', 'Pob. Uno', 'Pob. Dos', 'Pob. Tres'
        ];

        // 1. Total Encoded (Distinct households by barangay + purok + hh number)
        $totalEncoded = \Illuminate\Support\Facades\DB::table('households')
            ->selectRaw("COUNT(DISTINCT barangay || '-' || purok_sito || '-' || household_number) as total")
            ->value('total');

        // 2. Barangays Covered
        $barangaysCovered = \Illuminate\Support\Facades\DB::table('households')
            ->selectRaw('COUNT(DISTINCT barangay) as total')
            ->value('total');

        // 3. Demographics Sum
        $totals = \Illuminate\Support\Facades\DB::table('households')->selectRaw('
            SUM(COALESCE(newborn_male,0) + COALESCE(infant_male,0) + COALESCE(under_five_male,0) + COALESCE(children_male,0) + COALESCE(adolescence_male,0) + COALESCE(adult_male,0) + COALESCE(senior_citizen_male,0) + COALESCE(pwd_male,0)) as maleCount,
            SUM(COALESCE(newborn_female,0) + COALESCE(infant_female,0) + COALESCE(under_five_female,0) + COALESCE(children_female,0) + COALESCE(adolescence_female,0) + COALESCE(adult_female,0) + COALESCE(senior_citizen_female,0) + COALESCE(pwd_female,0)) as femaleCount,
            MAX(updated_at) as lastUpdate
        ')->first();

        // 4. Barangay Distribution
        $barangayCountsRaw = \Illuminate\Support\Facades\DB::table('households')
            ->selectRaw("barangay, COUNT(DISTINCT purok_sito || '-' || household_number) as count")
            ->groupBy('barangay')
            ->get()
            ->keyBy('barangay');

        $barangayDataArray = [];
        // Map database string variants to standard dashboard UI variants
        $aliasMap = [
            'Baclaran' => ['Baclaran', 'Bañadero'],
            'Pob. Uno' => ['Pob. Uno', 'Poblacion Uno'],
            'Pob. Dos' => ['Pob. Dos', 'Poblacion Dos'],
            'Pob. Tres' => ['Pob. Tres', 'Poblacion Tres']
        ];

        foreach ($allBarangays as $b) {
            $count = 0;
            if (isset($aliasMap[$b])) {
                foreach ($aliasMap[$b] as $dbName) {
                    $count += isset($barangayCountsRaw[$dbName]) ? $barangayCountsRaw[$dbName]->count : 0;
                }
            } else {
                $count = isset($barangayCountsRaw[$b]) ? $barangayCountsRaw[$b]->count : 0;
            }

            $barangayDataArray[] = [
                'barangay' => $b,
                'count' => $count,
                'displayName' => $b
            ];
        }

        return response()->json([
            'stats' => [
                'totalEncoded' => (int) $totalEncoded,
                'barangaysCovered' => (int) $barangaysCovered,
                'maleCount' => (int) ($totals->maleCount ?? 0),
                'femaleCount' => (int) ($totals->femaleCount ?? 0),
                'lastUpdate' => $totals->lastUpdate ? date('m/d/y', strtotime($totals->lastUpdate)) : '—'
            ],
            'barangayData' => $barangayDataArray
        ]);
    }

    public function barangaySummary(Request $request): JsonResponse
    {
        $query = \Illuminate\Support\Facades\DB::table('households');

        if ($request->has('barangay') && trim((string)$request->get('barangay')) !== '') {
            $query->where('barangay', $request->get('barangay'));
        }
        if ($request->has('purokBlockStreet') && trim((string)$request->get('purokBlockStreet')) !== '') {
            $query->where('purok_sito', $request->get('purokBlockStreet'));
        }
        if ($request->has('surveyYear') && is_numeric($request->get('surveyYear'))) {
            $query->whereYear('created_at', (int)$request->get('surveyYear'));
        }
        if ($request->has('surveyPeriodFrom') && $request->get('surveyPeriodFrom')) {
            $year = $request->get('surveyYear', date('Y'));
            $query->whereDate('created_at', '>=', "$year-" . str_pad($request->get('surveyPeriodFrom'), 2, '0', STR_PAD_LEFT) . "-01");
        }
        if ($request->has('surveyPeriodTo') && $request->get('surveyPeriodTo')) {
            $year = $request->get('surveyYear', date('Y'));
            $endOfMonth = date('Y-m-t', strtotime("$year-" . str_pad($request->get('surveyPeriodTo'), 2, '0', STR_PAD_LEFT) . "-01"));
            $query->whereDate('created_at', '<=', $endOfMonth);
        }

        // 1. Get totals and health/age metrics
        $totals = clone $query;
        $stats = $totals->selectRaw("
            COUNT(DISTINCT barangay || '-' || purok_sito || '-' || household_number) as unique_households,
            COUNT(id) as total_families,
            COUNT(DISTINCT purok_sito) as unique_puroks,
            SUM(number_of_members) as total_population,
            
            SUM(CASE WHEN number_of_members > 10 THEN 1 ELSE 0 END) as family_moreThan10,
            SUM(CASE WHEN number_of_members BETWEEN 8 AND 10 THEN 1 ELSE 0 END) as family_n8to10,
            SUM(CASE WHEN number_of_members BETWEEN 6 AND 7 THEN 1 ELSE 0 END) as family_n6to7,
            SUM(CASE WHEN number_of_members BETWEEN 2 AND 5 THEN 1 ELSE 0 END) as family_n2to5,
            SUM(CASE WHEN number_of_members <= 1 THEN 1 ELSE 0 END) as family_n1,

            SUM(COALESCE(newborn_male,0) + COALESCE(newborn_female,0)) as age_newborn,
            SUM(COALESCE(infant_male,0) + COALESCE(infant_female,0)) as age_infants,
            SUM(COALESCE(under_five_male,0) + COALESCE(under_five_female,0)) as age_underFive,
            SUM(COALESCE(children_male,0) + COALESCE(children_female,0)) as age_children5_9,
            SUM(COALESCE(adolescence_male,0) + COALESCE(adolescence_female,0)) as age_adolescence,
            SUM(COALESCE(adult_male,0) + COALESCE(adult_female,0)) as age_adult,
            
            SUM(COALESCE(pregnant,0)) as risk_pregnant,
            SUM(COALESCE(adolescent_pregnant,0)) as risk_adolescentPregnant,
            SUM(COALESCE(post_partum,0)) as risk_postPartum,
            SUM(COALESCE(women_15_49_not_pregnant,0)) as risk_women15_49,
            SUM(COALESCE(senior_citizen_male,0) + COALESCE(senior_citizen_female,0)) as risk_seniorCitizens,
            SUM(COALESCE(pwd_male,0) + COALESCE(pwd_female,0)) as risk_pwd,

            SUM(CASE WHEN couple_practicing_family_planning = 1 OR couple_practicing_family_planning = 'true' THEN 1 ELSE 0 END) as prac_coupleFP,
            SUM(CASE WHEN toilet_type = 1 THEN 1 ELSE 0 END) as prac_toiletImproved,
            SUM(CASE WHEN toilet_type = 2 THEN 1 ELSE 0 END) as prac_toiletShared,
            SUM(CASE WHEN toilet_type = 3 THEN 1 ELSE 0 END) as prac_toiletUnimproved,
            SUM(CASE WHEN toilet_type = 4 THEN 1 ELSE 0 END) as prac_toiletOpen,
            SUM(CASE WHEN water_source = 1 THEN 1 ELSE 0 END) as prac_waterImproved,
            SUM(CASE WHEN water_source = 2 THEN 1 ELSE 0 END) as prac_waterUnimproved,
            
            SUM(CASE WHEN UPPER(food_production_activity) = 'VG' THEN 1 ELSE 0 END) as prac_foodVG,
            SUM(CASE WHEN UPPER(food_production_activity) = 'FT' THEN 1 ELSE 0 END) as prac_foodFruit,
            SUM(CASE WHEN UPPER(food_production_activity) = 'PL' THEN 1 ELSE 0 END) as prac_foodPL,
            SUM(CASE WHEN UPPER(food_production_activity) = 'FP' THEN 1 ELSE 0 END) as prac_foodFP,
            SUM(CASE WHEN UPPER(food_production_activity) = 'NA' OR food_production_activity IS NULL OR food_production_activity = '' THEN 1 ELSE 0 END) as prac_foodNone,
            
            SUM(CASE WHEN using_iodized_salt = 1 OR using_iodized_salt = 'true' THEN 1 ELSE 0 END) as prac_iodizedSalt,
            SUM(CASE WHEN using_iron_fortified_rice = 1 OR using_iron_fortified_rice = 'true' THEN 1 ELSE 0 END) as prac_ironFortifiedRice
        ")->first();

        // 2. Extract Member stats using a JOIN grouping
        // We only aggregate for roles father, mother, caregiver
        $membersQuery = \Illuminate\Support\Facades\DB::table('household_members')
            ->join('households', 'households.id', '=', 'household_members.household_id')
            ->selectRaw('
                household_members.role,
                household_members.occupation,
                UPPER(household_members.educational_attainment) as educational_attainment,
                COUNT(*) as aggregate_count
            ')
            ->whereIn('household_members.role', ['father', 'mother', 'caregiver'])
            ->groupByRaw('household_members.role, household_members.occupation, UPPER(household_members.educational_attainment)');

        // Apply same filters to members join
        if ($request->has('barangay') && trim((string)$request->get('barangay')) !== '') {
            $membersQuery->where('households.barangay', $request->get('barangay'));
        }
        if ($request->has('purokBlockStreet') && trim((string)$request->get('purokBlockStreet')) !== '') {
            $membersQuery->where('households.purok_sito', $request->get('purokBlockStreet'));
        }
        if ($request->has('surveyYear') && is_numeric($request->get('surveyYear'))) {
            $membersQuery->whereYear('households.created_at', (int)$request->get('surveyYear'));
        }
        if ($request->has('surveyPeriodFrom') && $request->get('surveyPeriodFrom')) {
            $membersQuery->whereDate('households.created_at', '>=', "$year-" . str_pad($request->get('surveyPeriodFrom'), 2, '0', STR_PAD_LEFT) . "-01");
        }
        if ($request->has('surveyPeriodTo') && $request->get('surveyPeriodTo')) {
            $membersQuery->whereDate('households.created_at', '<=', $endOfMonth);
        }

        $membersGroups = $membersQuery->get();

        $occMap = ['1'=>0,'2'=>1,'3'=>2,'4'=>3,'5'=>4,'6'=>5,'7'=>6,'8'=>7,'9'=>8,'10'=>9,'11'=>10];
        $edMap = ['N'=>0,'EU'=>1,'EG'=>2,'HU'=>3,'HG'=>4,'CU'=>5,'CG'=>6,'V'=>7,'PG'=>8];

        $fatherOcc = array_fill(0, 11, 0);
        $fatherEd = array_fill(0, 9, 0);
        $motherOcc = array_fill(0, 11, 0);
        $motherEd = array_fill(0, 9, 0);
        $caregiverOcc = array_fill(0, 11, 0);
        $caregiverEd = array_fill(0, 9, 0);

        foreach ($membersGroups as $mg) {
            $role = strtolower($mg->role);
            $occIdx = $occMap[$mg->occupation] ?? 10;
            $edIdx = $edMap[$mg->educational_attainment] ?? 0;
            $count = $mg->aggregate_count;

            if ($role === 'father') {
                $fatherOcc[$occIdx] += $count;
                $fatherEd[$edIdx] += $count;
            } elseif ($role === 'mother') {
                $motherOcc[$occIdx] += $count;
                $motherEd[$edIdx] += $count;
            } elseif ($role === 'caregiver') {
                $caregiverOcc[$occIdx] += $count;
                $caregiverEd[$edIdx] += $count;
            }
        }

        return response()->json([
            'totals' => [
                'households' => (int) ($stats->unique_households ?? 0),
                'families' => (int) ($stats->total_families ?? 0),
                'purokBlockStreet' => (int) ($stats->unique_puroks ?? 0),
                'population' => (int) ($stats->total_population ?? 0),
            ],
            'familySize' => [
                'moreThan10' => (int) ($stats->family_moreThan10 ?? 0),
                'n8to10' => (int) ($stats->family_n8to10 ?? 0),
                'n6to7' => (int) ($stats->family_n6to7 ?? 0),
                'n2to5' => (int) ($stats->family_n2to5 ?? 0),
                'n1' => (int) ($stats->family_n1 ?? 0),
            ],
            'ageHealth' => [
                'newborn' => (int) ($stats->age_newborn ?? 0),
                'infants' => (int) ($stats->age_infants ?? 0),
                'underFive' => (int) ($stats->age_underFive ?? 0),
                'children5_9' => (int) ($stats->age_children5_9 ?? 0),
                'adolescence' => (int) ($stats->age_adolescence ?? 0),
                'adult' => (int) ($stats->age_adult ?? 0),
                'pregnant' => (int) ($stats->risk_pregnant ?? 0),
                'adolescentPregnant' => (int) ($stats->risk_adolescentPregnant ?? 0),
                'postPartum' => (int) ($stats->risk_postPartum ?? 0),
                'women15_49' => (int) ($stats->risk_women15_49 ?? 0),
                'seniorCitizens' => (int) ($stats->risk_seniorCitizens ?? 0),
                'pwd' => (int) ($stats->risk_pwd ?? 0),
            ],
            'practices' => [
                'coupleFP' => (int) ($stats->prac_coupleFP ?? 0),
                'toiletImproved' => (int) ($stats->prac_toiletImproved ?? 0),
                'toiletShared' => (int) ($stats->prac_toiletShared ?? 0),
                'toiletUnimproved' => (int) ($stats->prac_toiletUnimproved ?? 0),
                'toiletOpen' => (int) ($stats->prac_toiletOpen ?? 0),
                'waterImproved' => (int) ($stats->prac_waterImproved ?? 0),
                'waterUnimproved' => (int) ($stats->prac_waterUnimproved ?? 0),
                'foodVG' => (int) ($stats->prac_foodVG ?? 0),
                'foodFruit' => (int) ($stats->prac_foodFruit ?? 0),
                'foodPL' => (int) ($stats->prac_foodPL ?? 0),
                'foodFP' => (int) ($stats->prac_foodFP ?? 0),
                'foodNone' => (int) ($stats->prac_foodNone ?? 0),
                'iodizedSalt' => (int) ($stats->prac_iodizedSalt ?? 0),
                'ironFortifiedRice' => (int) ($stats->prac_ironFortifiedRice ?? 0),
            ],
            'fatherOcc' => $fatherOcc,
            'fatherEd' => $fatherEd,
            'motherOcc' => $motherOcc,
            'motherEd' => $motherEd,
            'caregiverOcc' => $caregiverOcc,
            'caregiverEd' => $caregiverEd,
        ]);
    }
}
