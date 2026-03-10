<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

try {
    (new Database\Seeders\LargeDummyDataSeeder)->run();
    echo "SUCCESS\n";
} catch (\Throwable $e) {
    file_put_contents('storage/logs/error.json', json_encode([
        'msg' => $e->getMessage(),
        'file' => $e->getFile(),
        'line' => $e->getLine()
    ]));
    echo "ERROR CAUGHT\n";
}
