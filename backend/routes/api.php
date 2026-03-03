<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\HouseholdController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// Public: login
Route::post('login', [AuthController::class, 'login']);

// Protected: auth required
Route::middleware('auth:sanctum')->group(function () {
    Route::post('logout', [AuthController::class, 'logout']);
    Route::get('user', [AuthController::class, 'user']);

    // Check duplicate household (HH No. + barangay) - must be before apiResource so "check-duplicate" is not treated as id
    Route::get('households/check-duplicate', [HouseholdController::class, 'checkDuplicate']);
    // Preview import: compare incoming data with existing records - must be before apiResource
    Route::post('households/preview-import', [HouseholdController::class, 'previewImport']);
    Route::apiResource('households', HouseholdController::class);
    Route::post('households/import', [HouseholdController::class, 'import']);
});
