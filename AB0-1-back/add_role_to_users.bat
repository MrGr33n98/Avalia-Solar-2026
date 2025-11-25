@echo off
echo =======================================
echo Adicionando campo role aos usuarios
echo =======================================
echo.

cd /d "%~dp0"

echo Gerando migration...
bundle exec rails generate migration AddRoleToUsers role:string

echo.
echo =======================================
echo Migration gerada!
echo.
echo Agora execute:
echo   bundle exec rails db:migrate
echo.
echo =======================================
pause
