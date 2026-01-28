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

        // Search filters
        if ($request->has('search')) {
            $search = $request->get('search');
            $query->where(function ($q) use ($search) {
                $q->where('household_number', 'like', "%{$search}%")
                  ->orWhere('barangay', 'like', "%{$search}%")
                  ->orWhere('municipality_city', 'like', "%{$search}%")
                  ->orWhere('province', 'like', "%{$search}%");
            });
        }

        // Filter by location
        if ($request->has('province')) {
            $query->where('province', $request->get('province'));
        }
        if ($request->has('municipality_city')) {
            $query->where('municipality_city', $request->get('municipality_city'));
        }
        if ($request->has('barangay')) {
            $query->where('barangay', $request->get('barangay'));
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
     * Import households from Excel/CSV file or JSON data.
     */
    public function import(Request $request): JsonResponse
    {
        $successful = 0;
        $failed = 0;
        $errors = [];

        try {
            // Check if request contains JSON data (from frontend Excel parsing)
            if ($request->has('households') && is_array($request->households)) {
                $households = $request->households;
                
                foreach ($households as $index => $householdData) {
                    try {
                        // Extract members from household data
                        $members = $householdData['members'] ?? [];
                        unset($householdData['members']);

                        // Validate and create household
                        $validator = \Validator::make($householdData, [
                            'household_number' => 'required|string|max:255',
                            'purok_sito' => 'nullable|string|max:255',
                            'barangay' => 'nullable|string|max:255',
                            'municipality_city' => 'nullable|string|max:255',
                            'province' => 'nullable|string|max:255',
                            'family_living_in_house' => 'nullable|integer|min:0',
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

                        // Check if household_number already exists
                        $existing = Household::where('household_number', $validated['household_number'])->first();
                        if ($existing) {
                            $failed++;
                            $errors[] = "Row " . ($index + 1) . ": Household number '{$validated['household_number']}' already exists";
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
                'message' => "Import completed. {$successful} successful, {$failed} failed.",
                'stats' => [
                    'total' => count($request->households ?? []),
                    'successful' => $successful,
                    'failed' => $failed,
                ],
                'errors' => $errors,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error importing data: ' . $e->getMessage(),
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
