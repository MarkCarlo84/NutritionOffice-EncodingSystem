<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

try {
    $request = Illuminate\Http\Request::create('/api/households/barangay-summary', 'POST');
    $controller = app(\App\Http\Controllers\Api\HouseholdController::class);
    $response = $controller->barangaySummary($request);
    echo "SUCCESS\n";
    echo substr($response->getContent(), 0, 500); // Print first 500 chars to verify
} catch (\Throwable $e) {
    file_put_contents('storage/logs/error_api2.json', json_encode([
        'msg' => $e->getMessage(),
        'file' => $e->getFile(),
        'line' => $e->getLine()
    ]));
    echo "ERROR CAUGHT\n";
}
