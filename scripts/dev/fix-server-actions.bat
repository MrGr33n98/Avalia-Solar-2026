@echo off
REM Fix Next.js Server Actions errors - Clean rebuild

echo 🔧 Fixing Server Action errors...
echo ================================

cd AB0-1-front

echo 1. Stopping containers...
docker-compose down

echo 2. Cleaning Next.js cache...
if exist .next rmdir /s /q .next
if exist .swc rmdir /s /q .swc
if exist node_modules\.cache rmdir /s /q node_modules\.cache
if exist .cache rmdir /s /q .cache

echo 3. Rebuilding frontend...
docker-compose build --no-cache ab0-frontend

echo 4. Starting services...
docker-compose up -d

echo ✅ Done! The Server Action errors should be fixed.
echo    Monitor logs with: docker-compose logs -f ab0-frontend
pause
