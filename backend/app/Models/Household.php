<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Household extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'purok_sito',
        'barangay',
        'municipality_city',
        'province',
        'household_number',
        'family_living_in_house',
        'number_of_members',
        'nhts_household_group',
        'indigenous_group',
        'newborn_male',
        'newborn_female',
        'infant_male',
        'infant_female',
        'under_five_male',
        'under_five_female',
        'children_male',
        'children_female',
        'adolescence_male',
        'adolescence_female',
        'pregnant',
        'adolescent_pregnant',
        'post_partum',
        'women_15_49_not_pregnant',
        'adult_male',
        'adult_female',
        'senior_citizen_male',
        'senior_citizen_female',
        'pwd_male',
        'pwd_female',
        'toilet_type',
        'water_source',
        'food_production_activity',
        'couple_practicing_family_planning',
        'using_iodized_salt',
        'using_iron_fortified_rice',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'couple_practicing_family_planning' => 'boolean',
            'using_iodized_salt' => 'boolean',
            'using_iron_fortified_rice' => 'boolean',
        ];
    }

    /**
     * Get the household members (Father, Mother, Caregiver).
     */
    public function members(): HasMany
    {
        return $this->hasMany(HouseholdMember::class);
    }
}
