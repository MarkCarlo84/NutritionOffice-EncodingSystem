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

    /**
     * Display the specified resource.
     */
    public function show(string $id): JsonResponse
    {
        $household = Household::with('members')->findOrFail($id);

        return response()->json($household);
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
            $diffs = [];
            foreach ($fieldLabels as $field => $label) {
                $newVal = $householdData[$field] ?? null;
                $oldVal = $existing->$field;

                // Normalize booleans and nulls for comparison
                $oldNorm = is_bool($oldVal) ? ($oldVal ? 'Yes' : 'No') : (string)($oldVal ?? '');
                $newNorm = is_bool($newVal) ? ($newVal ? 'Yes' : 'No') : (string)($newVal ?? '');

                if ($oldNorm !== $newNorm) {
                    $diffs[] = [
                        'field'    => $field,
                        'label'    => $label,
                        'oldValue' => $oldVal,
                        'newValue' => $newVal,
                    ];
                }
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
}
