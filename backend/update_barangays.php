<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;

DB::table('households')->where('barangay', 'Poblacion Uno')->update(['barangay' => 'Pob. Uno']);
DB::table('households')->where('barangay', 'Poblacion Dos')->update(['barangay' => 'Pob. Dos']);
DB::table('households')->where('barangay', 'Poblacion Tres')->update(['barangay' => 'Pob. Tres']);

// The seeder missed Baclaran but included Bañadero (which is not in the dashboard list).
// Let's migrate Bañadero households to Baclaran to provide data for Baclaran.
DB::table('households')->where('barangay', 'Bañadero')->update(['barangay' => 'Baclaran']);

echo "Barangays updated successfully.\n";
