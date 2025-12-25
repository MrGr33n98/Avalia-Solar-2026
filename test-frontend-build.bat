@echo off
REM 🔧 Script de teste local do frontend (Windows)
REM Testa build antes de fazer deploy

echo 🚀 Testando build do frontend...
echo.

cd AB0-1-front

echo 📦 1. Limpando cache...
if exist .next rmdir /s /q .next
if exist node_modules\.cache rmdir /s /q node_modules\.cache

echo.
echo 🔍 2. Verificando TypeScript...
call npx tsc --noEmit

if %ERRORLEVEL% NEQ 0 (
  echo.
  echo ❌ Erros de TypeScript encontrados!
  echo Corrija os erros antes de continuar.
  exit /b 1
)

echo.
echo ✅ TypeScript OK!
echo.
echo 🏗️ 3. Fazendo build de produção...
call npm run build

if %ERRORLEVEL% NEQ 0 (
  echo.
  echo ❌ Build falhou!
  echo Verifique os erros acima.
  exit /b 1
)

echo.
echo ✅ Build completo com sucesso!
echo.

echo 🎉 Pronto para deploy!
echo.
echo Próximos passos:
echo 1. docker-compose build frontend
echo 2. docker-compose up -d
echo 3. docker logs avalia_frontend_prod --tail 50
