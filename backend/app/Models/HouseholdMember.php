<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class HouseholdMember extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'household_id',
        'name',
        'role',
        'occupation',
        'educational_attainment',
        'practicing_family_planning',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'practicing_family_planning' => 'boolean',
        ];
    }

    /**
     * Get the household that owns the member.
     */
    public function household(): BelongsTo
    {
        return $this->belongsTo(Household::class);
    }
}
