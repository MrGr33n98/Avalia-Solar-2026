@echo off
chcp 65001 >nul
echo ╔═══════════════════════════════════════════════════════════╗
echo ║     📦 INSTALAR GEMS OAUTH - Bundle Install               ║
echo ╚═══════════════════════════════════════════════════════════╝
echo.

cd /d "%~dp0\AB0-1-back"

echo [1/3] Verificando Bundler...
where bundle >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Bundler não encontrado!
    echo    Execute: gem install bundler
    pause
    exit /b 1
)
echo ✅ Bundler instalado

echo.
echo [2/3] Instalando gems OAuth...
echo    Isso pode levar alguns minutos...
echo.

bundle install

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✅ Gems instaladas com sucesso!
    echo.
    echo [3/3] Verificando gems OAuth...
    bundle info omniauth-linkedin-oauth2 >nul 2>&1
    if %ERRORLEVEL% EQU 0 (
        echo ✅ omniauth-linkedin-oauth2 instalado
    ) else (
        echo ⚠️  omniauth-linkedin-oauth2 não encontrado
    )
    
    bundle info omniauth-rails_csrf_protection >nul 2>&1
    if %ERRORLEVEL% EQU 0 (
        echo ✅ omniauth-rails_csrf_protection instalado
    ) else (
        echo ⚠️  omniauth-rails_csrf_protection não encontrado
    )
    
    echo.
    echo ╔═══════════════════════════════════════════════════════════╗
    echo ║              ✅ INSTALAÇÃO COMPLETA!                      ║
    echo ╚═══════════════════════════════════════════════════════════╝
    echo.
    echo 🚀 Próximos passos:
    echo    1. bundle exec rails console
    echo    2. User.omniauth_providers
    echo       (deve retornar: [:google_oauth2, :linkedin])
    echo    3. bundle exec rails server
    echo.
) else (
    echo.
    echo ❌ Erro ao instalar gems!
    echo    Verifique os erros acima.
    echo.
)

pause
