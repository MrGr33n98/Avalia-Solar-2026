@echo off
REM Remotion Rendering Commands - Avalia Solar (Windows)
REM ==================================================
REM Quick reference for rendering videos
REM Run from: C:\Users\Bobi\Desktop\AB0-1-main\videos

cd /d "%~dp0"

:menu
cls
echo.
echo  ========================================
echo  Avalia Solar - Remotion Video System
echo  ========================================
echo.
echo  1. Install Dependencies
echo  2. Start Studio (Development)
echo.
echo  === RENDERING ===
echo  3. Render: Residencial Leads (31s)
echo  4. Render: B2B Empresas (58s)
echo  5. Render: Reviews Generation (32s)
echo  6. Render: Categorias Discovery (50s)
echo  7. Render: ALL Videos
echo.
echo  === ADVANCED ===
echo  8. Render with High Quality (H.265)
echo  9. Render with Parallelization
echo.
echo  0. Exit
echo.

set /p choice="Choose an option: "

if "%choice%"=="1" goto install
if "%choice%"=="2" goto studio
if "%choice%"=="3" goto residencial
if "%choice%"=="4" goto empresas
if "%choice%"=="5" goto reviews
if "%choice%"=="6" goto categorias
if "%choice%"=="7" goto all
if "%choice%"=="8" goto hq
if "%choice%"=="9" goto parallel
if "%choice%"=="0" goto end
goto menu

:install
cls
echo Installing dependencies...
call npm install
pause
goto menu

:studio
cls
echo Starting Remotion Studio...
echo Opening: http://localhost:3000
call npm run dev
pause
goto menu

:residencial
cls
echo Rendering: Residencial Leads...
call npm run render:residencial
echo.
echo Output: out\residencial-leads.mp4
pause
goto menu

:empresas
cls
echo Rendering: B2B Empresas...
call npm run render:empresas
echo.
echo Output: out\b2b-empresas.mp4
pause
goto menu

:reviews
cls
echo Rendering: Reviews Generation...
call npm run render:reviews
echo.
echo Output: out\reviews-generation.mp4
pause
goto menu

:categorias
cls
echo Rendering: Categorias Discovery...
call npm run render:categorias
echo.
echo Output: out\categorias-discovery.mp4
pause
goto menu

:all
cls
echo Rendering ALL videos...
call npm run render:all
echo.
echo All videos rendered in: out\
pause
goto menu

:hq
cls
echo Rendering with HIGH QUALITY (H.265)...
call npx remotion render src/Root.tsx ResidencialLeads ^
  --output=out/residencial-leads-hq.mp4 ^
  --quality 100 ^
  --codec h265
echo.
echo Output: out\residencial-leads-hq.mp4
pause
goto menu

:parallel
cls
echo Rendering with PARALLELIZATION (4 threads)...
call npx remotion render src/Root.tsx B2BEmpresas ^
  --output=out/b2b-empresas-fast.mp4 ^
  --concurrency 4
echo.
echo Output: out\b2b-empresas-fast.mp4
pause
goto menu

:end
cls
echo Goodbye!
exit /b 0
