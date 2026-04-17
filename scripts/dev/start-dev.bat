@echo off
echo ============================================
echo   AvaliaSolar - Development Environment
echo ============================================
echo.

REM Check if Ruby is installed
where ruby >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Ruby is not installed or not in PATH
    echo Please install Ruby 3.x first
    pause
    exit /b 1
)

REM Check if Node.js is installed
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not installed or not in PATH
    echo Please install Node.js 18.x or higher first
    pause
    exit /b 1
)

echo [1/3] Starting Backend Server (Rails)...
cd /d "%~dp0AB0-1-back"
start "AvaliaSolar Backend" cmd /k "bundle exec rails server -p 3001"
timeout /t 3 /nobreak >nul

echo [2/3] Starting Frontend Server (Next.js)...
cd /d "%~dp0AB0-1-front"
start "AvaliaSolar Frontend" cmd /k "npm run dev"
timeout /t 3 /nobreak >nul

echo.
echo ============================================
echo   Servers Starting...
echo ============================================
echo.
echo Backend:  http://localhost:3001
echo Frontend: http://localhost:3000
echo.
echo Press any key to open the frontend in your browser...
pause >nul
start http://localhost:3000/dashboard
