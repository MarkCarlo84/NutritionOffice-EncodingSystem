<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;

echo "Cleaning up incorrect barangays...\n\n";

$wrongBarangays = [
    'Barangay I (Poblacion)',
    'Barangay II (Poblacion)',
    'Barangay III (Poblacion)',
    'Barangay 18 (Poblacion)',
    'Masiit'
];

foreach ($wrongBarangays as $barangay) {
    $count = DB::table('households')->where('barangay', $barangay)->count();
    if ($count > 0) {
        echo "Deleting {$count} households from '{$barangay}'...\n";
        DB::table('households')->where('barangay', $barangay)->delete();
    }
}

echo "\nCurrent barangays in database:\n";
$barangays = DB::table('households')
    ->select('barangay', DB::raw('count(*) as total'))
    ->groupBy('barangay')
    ->orderBy('barangay')
    ->get();

foreach ($barangays as $b) {
    echo "  - {$b->barangay}: {$b->total} households\n";
}

echo "\nTotal households: " . DB::table('households')->count() . "\n";
echo "\nCleanup complete!\n";
