@echo off
echo =======================================
echo Stopping Redis Server
echo =======================================
echo.

docker stop redis-dev
if %errorlevel% equ 0 (
    echo Redis parado com sucesso!
) else (
    echo Erro ao parar Redis ou container nao existe
)

echo.
pause
