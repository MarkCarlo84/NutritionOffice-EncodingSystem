@echo off
echo ==============================================
echo Starting Household Encoding System...
echo ==============================================

:: Change to the directory where this script is located
cd /d "%~dp0"

:: ---- BACKEND SETUP ----
start "Household Encoding System - Backend" cmd /k "cd /d "%~dp0backend" && (if not exist vendor (echo Composer dependencies not found. Running composer install... && composer install) else (echo Composer dependencies already installed. Skipping.)) && (if not exist .db_initialized (echo Running migrations and seeders... && php artisan migrate --force && php artisan db:seed --force && echo. > .db_initialized) else (echo Database already initialized. Skipping migrate and seed.)) && php artisan serve"

:: ---- FRONTEND SETUP ----
start "Household Encoding System - Frontend" cmd /k "cd /d "%~dp0frontend" && (if not exist node_modules (echo node_modules not found. Running npm install... && npm install) else (echo NPM dependencies already installed. Skipping.)) && npm run dev"

echo Waiting 5 seconds for servers to start...
timeout /t 5 /nobreak > nul

:: Open the browser
start http://localhost:5173

echo Done! You can close this window.
exit
