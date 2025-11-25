@echo off
echo Fixing Sidekiq namespace error...
echo.

cd /d "%~dp0"

echo Step 1: Ensuring redis-namespace is not in Gemfile...
findstr /i "redis-namespace" Gemfile
if %errorlevel% equ 0 (
    echo WARNING: redis-namespace found in Gemfile - please remove it manually
) else (
    echo OK: redis-namespace not found in Gemfile
)
echo.

echo Step 2: Removing Gemfile.lock to force clean install...
if exist Gemfile.lock (
    del Gemfile.lock
    echo Gemfile.lock removed
) else (
    echo Gemfile.lock not found
)
echo.

echo Step 3: Running bundle install...
bundle install
echo.

echo Step 4: Clearing Rails cache...
if exist tmp\cache (
    rd /s /q tmp\cache
    echo Cache cleared
)
echo.

echo Step 5: Restarting any Sidekiq processes...
echo Please manually restart your Rails server and Sidekiq worker
echo.

echo Done! The namespace error should be fixed.
echo If you still see the error, make sure no other configuration files
echo are passing a :namespace option to Redis.
pause
