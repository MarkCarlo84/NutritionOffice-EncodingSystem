<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$counts = \Illuminate\Support\Facades\DB::table('households')->selectRaw('barangay, COUNT(*) as count')->groupBy('barangay')->get();

foreach ($counts as $c) {
    echo $c->barangay . ': ' . $c->count . "\n";
}

$distinctCount = \Illuminate\Support\Facades\DB::table('households')
            ->selectRaw("COUNT(DISTINCT barangay || '-' || purok_sito || '-' || household_number) as total")
            ->value('total');
echo "Distinct Count: " . $distinctCount . "\n";
