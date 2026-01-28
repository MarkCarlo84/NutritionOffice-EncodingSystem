# Household Profile API Documentation

## Overview
This API handles the encoding system for BNS Form No. 1A - Philippine Plan of Action for Nutrition - HOUSEHOLD PROFILE.

## Base URL
```
/api/households
```

## Endpoints

### 1. List All Households
**GET** `/api/households`

**Query Parameters:**
- `search` (optional): Search by household number, barangay, municipality, or province
- `province` (optional): Filter by province
- `municipality_city` (optional): Filter by municipality/city
- `barangay` (optional): Filter by barangay
- `per_page` (optional): Number of items per page (default: 15)

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "household_number": "HH-001",
      "purok_sito": "Purok 1",
      "barangay": "Barangay A",
      "municipality_city": "City A",
      "province": "Province A",
      "members": [...]
    }
  ],
  "current_page": 1,
  "per_page": 15,
  "total": 100
}
```

### 2. Get Single Household
**GET** `/api/households/{id}`

**Response:**
```json
{
  "id": 1,
  "household_number": "HH-001",
  "purok_sito": "Purok 1",
  "barangay": "Barangay A",
  "municipality_city": "City A",
  "province": "Province A",
  "family_living_in_house": 1,
  "number_of_members": 5,
  "nhts_household_group": 1,
  "indigenous_group": 2,
  "members": [
    {
      "id": 1,
      "name": "Juan Dela Cruz",
      "role": "father",
      "occupation": 6,
      "educational_attainment": "EG",
      "practicing_family_planning": true
    }
  ]
}
```

### 3. Create Household
**POST** `/api/households`

**Request Body:**
```json
{
  "purok_sito": "Purok 1",
  "barangay": "Barangay A",
  "municipality_city": "City A",
  "province": "Province A",
  "household_number": "HH-001",
  "family_living_in_house": 1,
  "number_of_members": 5,
  "nhts_household_group": 1,
  "indigenous_group": 2,
  "newborn_male": 0,
  "newborn_female": 0,
  "infant_male": 1,
  "infant_female": 0,
  "under_five_male": 1,
  "under_five_female": 1,
  "children_male": 0,
  "children_female": 0,
  "adolescence_male": 0,
  "adolescence_female": 0,
  "pregnant": 0,
  "adolescent_pregnant": 0,
  "post_partum": 0,
  "women_15_49_not_pregnant": 1,
  "adult_male": 1,
  "adult_female": 1,
  "senior_citizen_male": 0,
  "senior_citizen_female": 0,
  "pwd_male": 0,
  "pwd_female": 0,
  "toilet_type": 1,
  "water_source": 1,
  "food_production_activity": "VG",
  "using_iodized_salt": true,
  "using_iron_fortified_rice": true,
  "members": [
    {
      "name": "Juan Dela Cruz",
      "role": "father",
      "occupation": 6,
      "educational_attainment": "EG",
      "practicing_family_planning": true
    },
    {
      "name": "Maria Dela Cruz",
      "role": "mother",
      "occupation": 11,
      "educational_attainment": "EG",
      "practicing_family_planning": true
    }
  ]
}
```

### 4. Update Household
**PUT/PATCH** `/api/households/{id}`

**Request Body:** Same as Create, but all fields are optional.

**Note:** When updating members, include `id` for existing members to update them, or omit `id` to create new ones. Members not included in the request will be deleted.

### 5. Delete Household
**DELETE** `/api/households/{id}`

**Response:**
```json
{
  "message": "Household deleted successfully"
}
```

## Code Reference

### NHTS Household Group (C4)
- `1` - NHTS 4Ps
- `2` - NHTS Non-4Ps
- `3` - Non-NHTS

### Indigenous Group (C5)
- `1` - IP (Indigenous People)
- `2` - Non-IP

### Occupation (C27)
- `1` - Manager
- `2` - Professional
- `3` - Technician & Associate Professionals
- `4` - Clerical Support Workers
- `5` - Service and Sales Worker
- `6` - Skilled agricultural, forestry and fishery workers
- `7` - Craft and related trade workers
- `8` - Plant and machine operators and assemblers
- `9` - Elementary occupations
- `10` - Armed Forces Occupations
- `11` - None

### Educational Attainment (C28)
- `N` - None
- `EU` - Elementary undergraduate
- `EG` - Elementary graduate
- `HU` - High school undergraduate
- `HG` - High school graduate
- `CU` - College undergraduate
- `CG` - College graduate
- `V` - Vocational
- `PG` - Post graduate studies

### Toilet Type (C30)
- `1` - Improved sanitation
- `2` - Shared facility
- `3` - Unimproved
- `4` - Open defecation

### Water Source (C31)
- `1` - Improved source
- `2` - Unimproved source

### Food Production Activity (C32)
- `VG` - Vegetable Garden
- `FT` - Fruit
- `PL` - Poultry Livestock
- `FP` - Fish pond
- `NA` - None

### Household Member Roles
- `father` - Father (Fa)
- `mother` - Mother (Mo)
- `caregiver` - Caregiver (Ca)

## Age Classifications

All age classification fields accept integer values (counts):

- **Newborn**: 0-28 days (newborn_male, newborn_female)
- **Infant**: 29 days - 11 months (infant_male, infant_female)
- **Under-five**: 1-4 years old (under_five_male, under_five_female)
- **Children**: 5-9 years old (children_male, children_female)
- **Adolescence**: 10-19 years old (adolescence_male, adolescence_female)
- **Adult**: 20-59 years old (adult_male, adult_female)
- **Senior Citizens**: 60+ years old (senior_citizen_male, senior_citizen_female)

## Health Risk Groups

- **Pregnant**: Count of pregnant women
- **Adolescent Pregnant**: Count of pregnant adolescents
- **Post-Partum (PP)**: Count of post-partum women
- **Women 15-49 not pregnant & non PP**: Count of women aged 15-49 who are not pregnant and not post-partum
- **Person With Disability (PWD)**: pwd_male, pwd_female

## Validation Rules

- `household_number` is required and must be unique
- All numeric fields must be non-negative integers
- All code fields must match the values specified in the Code Reference section
- Member roles must be one of: father, mother, caregiver
- When members are provided, name and role are required for each member
