@echo off
title Nutrition Office Encoding System - Launcher
color 0C
echo ============================================================
echo           NUTRITION OFFICE ENCODING SYSTEM
echo ============================================================
echo.
echo [1/3] Starting Backend Service...
start /min cmd /c "cd /d "C:\NO System\NutritionOffice-EncodingSystem\backend" && php artisan serve"

echo [2/3] Starting Frontend Service...
start /min cmd /c "cd /d "C:\NO System\NutritionOffice-EncodingSystem\frontend" && npm start"

echo.
echo [3/3] Waiting for system to initialize (5 seconds)...
timeout /t 5 /nobreak > nul

echo.
echo Opening the system in your browser...
start http://localhost:5173

echo.
echo ============================================================
echo   SYSTEM IS READY! 
echo   Please DO NOT close this window while using the system.
echo   To stop the system, you can close this window.
echo ============================================================
pause
