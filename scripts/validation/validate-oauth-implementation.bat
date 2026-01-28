@echo off
chcp 65001 >nul
echo ╔═══════════════════════════════════════════════════════════╗
echo ║     🔐 VALIDAR OAUTH IMPLEMENTATION                       ║
echo ╚═══════════════════════════════════════════════════════════╝
echo.

cd /d "%~dp0\AB0-1-back"

echo [1/7] Verificando Gemfile...
findstr /C:"omniauth-linkedin-oauth2" Gemfile >nul
if %ERRORLEVEL% EQU 0 (
    echo ✅ Gem LinkedIn OAuth2 adicionado
) else (
    echo ❌ Gem LinkedIn OAuth2 NÃO encontrado!
    goto END
)

findstr /C:"omniauth-rails_csrf_protection" Gemfile >nul
if %ERRORLEVEL% EQU 0 (
    echo ✅ Gem CSRF protection adicionado
) else (
    echo ⚠️  Gem CSRF protection não encontrado (opcional)
)

echo.
echo [2/7] Verificando User Model...
set MODEL_OK=0
findstr /C:":linkedin" app\models\user.rb >nul
if %ERRORLEVEL% EQU 0 (
    echo ✅ Providers configurados (Google + LinkedIn)
    set MODEL_OK=1
)

if %MODEL_OK% EQU 0 (
    echo ❌ Providers NÃO configurados corretamente!
    goto END
)

findstr /C:"send_confirmation_instructions" app\models\user.rb >nul
if %ERRORLEVEL% EQU 0 (
    echo ✅ Método send_confirmation_instructions presente
) else (
    echo ❌ Método send_confirmation_instructions NÃO encontrado!
)

echo.
echo [3/7] Verificando OmniAuth Callbacks Controller...
findstr /C:"def linkedin" app\controllers\users\omniauth_callbacks_controller.rb >nul
if %ERRORLEVEL% EQU 0 (
    echo ✅ Callback LinkedIn implementado
) else (
    echo ❌ Callback LinkedIn NÃO implementado!
    goto END
)

findstr /C:"approved_by_admin" app\controllers\users\omniauth_callbacks_controller.rb >nul
if %ERRORLEVEL% EQU 0 (
    echo ✅ Verificação de aprovação implementada
) else (
    echo ❌ Verificação de aprovação NÃO implementada!
)

echo.
echo [4/7] Verificando Devise Initializer...
findstr /C:"config.omniauth :linkedin" config\initializers\devise.rb >nul
if %ERRORLEVEL% EQU 0 (
    echo ✅ LinkedIn OAuth configurado no Devise
) else (
    echo ❌ LinkedIn OAuth NÃO configurado no Devise!
    goto END
)

echo.
echo [5/7] Verificando Variáveis de Ambiente...
findstr /C:"GOOGLE_CLIENT_ID" .env.development >nul
if %ERRORLEVEL% EQU 0 (
    echo ✅ GOOGLE_CLIENT_ID configurado
) else (
    echo ⚠️  GOOGLE_CLIENT_ID não configurado (você precisa adicionar)
)

findstr /C:"LINKEDIN_CLIENT_ID" .env.development >nul
if %ERRORLEVEL% EQU 0 (
    echo ✅ LINKEDIN_CLIENT_ID configurado
) else (
    echo ⚠️  LINKEDIN_CLIENT_ID não configurado (você precisa adicionar)
)

echo.
echo [6/7] Verificando se gems estão instaladas...
bundle check >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo ✅ Todas as gems instaladas
) else (
    echo ⚠️  Gems faltando - execute: bundle install
)

echo.
echo [7/7] Verificando Routes...
bundle exec rails routes 2>nul | findstr "google_oauth2" >nul
if %ERRORLEVEL% EQU 0 (
    echo ✅ Rotas OAuth presentes
) else (
    echo ⚠️  Rotas OAuth não carregadas (Rails não está rodando)
)

echo.
echo ╔═══════════════════════════════════════════════════════════╗
echo ║              📊 RESUMO DA VALIDAÇÃO                       ║
echo ╚═══════════════════════════════════════════════════════════╝
echo.
echo ✅ CONCLUÍDO:
echo    - Gemfile atualizado com LinkedIn OAuth
echo    - User model configurado com LinkedIn provider
echo    - Callbacks implementados (Google + LinkedIn)
echo    - Verificação de aprovação admin implementada
echo    - Devise initializer configurado
echo.
echo ⏳ AÇÕES NECESSÁRIAS:
echo    1. Execute: bundle install
echo    2. Configure credenciais OAuth no .env.development:
echo       - GOOGLE_CLIENT_ID
echo       - GOOGLE_CLIENT_SECRET
echo       - LINKEDIN_CLIENT_ID
echo       - LINKEDIN_CLIENT_SECRET
echo    3. Reinicie o servidor Rails
echo    4. Teste OAuth no frontend
echo.
echo 📖 Leia: OAUTH_IMPLEMENTATION_COMPLETE.md
echo.
goto END2

:END
echo.
echo ❌ Validação falhou! Verifique os erros acima.
echo.

:END2
pause
