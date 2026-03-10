@echo off
echo ==============================================
echo Starting Household Encoding System...
echo ==============================================

:: Change to the directory where this script is located
cd /d "%~dp0"

echo Starting Backend...
cd backend
start "Household Encoding System - Backend" cmd /k "php artisan serve"

:: Go back to main folder
cd ..

echo Starting Frontend...
cd frontend
start "Household Encoding System - Frontend" cmd /k "npm run dev"

echo Waiting 5 seconds for servers to start...
timeout /t 5 /nobreak > nul

:: Open the browser
start http://localhost:5173

echo Done! You can close this window.
exit
