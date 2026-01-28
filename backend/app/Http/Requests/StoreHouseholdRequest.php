<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreHouseholdRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            // Location Information
            'purok_sito' => ['nullable', 'string', 'max:255'],
            'barangay' => ['nullable', 'string', 'max:255'],
            'municipality_city' => ['nullable', 'string', 'max:255'],
            'province' => ['nullable', 'string', 'max:255'],
            
            // Household Identification
            'household_number' => ['required', 'string', 'max:255', 'unique:households,household_number'],
            'family_living_in_house' => ['nullable', 'integer', 'min:0'],
            'number_of_members' => ['nullable', 'integer', 'min:0'],
            'nhts_household_group' => ['nullable', 'integer', Rule::in([1, 2, 3])], // 1-NHTS 4Ps, 2-NHTS Non-4Ps, 3-Non-NHTS
            'indigenous_group' => ['nullable', 'integer', Rule::in([1, 2])], // 1-IP, 2-Non-IP
            
            // Age Classification - Newborn
            'newborn_male' => ['nullable', 'integer', 'min:0'],
            'newborn_female' => ['nullable', 'integer', 'min:0'],
            
            // Age Classification - Infant
            'infant_male' => ['nullable', 'integer', 'min:0'],
            'infant_female' => ['nullable', 'integer', 'min:0'],
            
            // Age Classification - Under-five
            'under_five_male' => ['nullable', 'integer', 'min:0'],
            'under_five_female' => ['nullable', 'integer', 'min:0'],
            
            // Age Classification - Children
            'children_male' => ['nullable', 'integer', 'min:0'],
            'children_female' => ['nullable', 'integer', 'min:0'],
            
            // Age Classification - Adolescence
            'adolescence_male' => ['nullable', 'integer', 'min:0'],
            'adolescence_female' => ['nullable', 'integer', 'min:0'],
            
            // Health Risk Groups
            'pregnant' => ['nullable', 'integer', 'min:0'],
            'adolescent_pregnant' => ['nullable', 'integer', 'min:0'],
            'post_partum' => ['nullable', 'integer', 'min:0'],
            'women_15_49_not_pregnant' => ['nullable', 'integer', 'min:0'],
            
            // Age Classification - Adult
            'adult_male' => ['nullable', 'integer', 'min:0'],
            'adult_female' => ['nullable', 'integer', 'min:0'],
            
            // Age Classification - Senior Citizens
            'senior_citizen_male' => ['nullable', 'integer', 'min:0'],
            'senior_citizen_female' => ['nullable', 'integer', 'min:0'],
            
            // Person With Disability
            'pwd_male' => ['nullable', 'integer', 'min:0'],
            'pwd_female' => ['nullable', 'integer', 'min:0'],
            
            // Household Facilities/Resources
            'toilet_type' => ['nullable', 'integer', Rule::in([1, 2, 3, 4])], // 1-Improved, 2-Shared, 3-Unimproved, 4-Open defecation
            'water_source' => ['nullable', 'integer', Rule::in([1, 2])], // 1-Improved, 2-Unimproved
            'food_production_activity' => ['nullable', 'string', Rule::in(['VG', 'FT', 'PL', 'FP', 'NA'])], // VG-Vegetable Garden, FT-Fruit, PL-Poultry Livestock, FP-Fish pond, NA-None
            
            // Household Practices
            'couple_practicing_family_planning' => ['nullable', 'boolean'],
            'using_iodized_salt' => ['nullable', 'boolean'],
            'using_iron_fortified_rice' => ['nullable', 'boolean'],
            
            // Household Members (Father, Mother, Caregiver)
            'members' => ['nullable', 'array'],
            'members.*.name' => ['required_with:members', 'string', 'max:255'],
            'members.*.role' => ['required_with:members', 'string', Rule::in(['father', 'mother', 'caregiver'])],
            'members.*.occupation' => ['nullable', 'integer', Rule::in([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11])],
            'members.*.educational_attainment' => ['nullable', 'string', Rule::in(['N', 'EU', 'EG', 'HU', 'HG', 'CU', 'CG', 'V', 'PG'])],
            'members.*.practicing_family_planning' => ['nullable', 'boolean'],
        ];
    }
}
