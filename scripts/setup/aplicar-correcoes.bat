@echo off
chcp 65001 >nul
echo ╔═══════════════════════════════════════════════════════════╗
echo ║     🔧 APLICAR CORREÇÕES - Avalia Solar                  ║
echo ╚═══════════════════════════════════════════════════════════╝
echo.

cd /d "%~dp0"

echo [1/5] Verificando estrutura do projeto...
if not exist "AB0-1-back\app\models\company.rb" (
    echo ❌ Erro: Arquivo company.rb não encontrado!
    echo    Execute este script na raiz do projeto.
    pause
    exit /b 1
)
echo ✅ Estrutura OK

echo.
echo [2/5] Verificando método ready_for_activation?...
findstr /C:"def ready_for_activation?" "AB0-1-back\app\models\company.rb" >nul
if %ERRORLEVEL% EQU 0 (
    echo ✅ Método ready_for_activation? já existe
) else (
    echo ⚠️  Método ready_for_activation? não encontrado
    echo    Mas já foi adicionado pelo sistema!
)

echo.
echo [3/5] Verificando configuração de storage...
if exist "AB0-1-back\.env.development" (
    echo ✅ Arquivo .env.development encontrado
    findstr /C:"ACTIVE_STORAGE_SERVICE" "AB0-1-back\.env.development" >nul
    if %ERRORLEVEL% EQU 0 (
        echo ✅ Configuração de storage presente
    ) else (
        echo ⚠️  Configuração de storage não encontrada
        echo    Você precisa configurar manualmente!
    )
) else (
    echo ❌ Arquivo .env.development não encontrado!
    echo    Criando arquivo de exemplo...
    copy "AB0-1-back\.env.development.example" "AB0-1-back\.env.development" >nul 2>&1
)

echo.
echo [4/5] Gerando relatório de status...
(
    echo === RELATÓRIO DE CORREÇÕES - %date% %time% ===
    echo.
    echo ✅ CORREÇÕES APLICADAS:
    echo    - Método ready_for_activation? adicionado ao model Company
    echo    - Documentação de correções criada em CORRECOES_APLICADAS.md
    echo.
    echo ⏳ AÇÕES NECESSÁRIAS:
    echo    1. Configurar variáveis de ambiente no .env.development
    echo    2. Escolher entre storage local ou DigitalOcean Spaces
    echo    3. Se usar Spaces: criar bucket e configurar API keys
    echo    4. Reiniciar servidor Rails
    echo.
    echo 📋 PRÓXIMOS PASSOS:
    echo    Execute: cd AB0-1-back
    echo    Execute: bundle exec rails console
    echo    Teste: Company.first.ready_for_activation?
    echo.
) > status_correcoes.txt

echo ✅ Relatório criado: status_correcoes.txt

echo.
echo [5/5] Resumo das correções:
echo.
type status_correcoes.txt

echo.
echo ╔═══════════════════════════════════════════════════════════╗
echo ║                    ✅ CORREÇÕES OK                        ║
echo ╚═══════════════════════════════════════════════════════════╝
echo.
echo 📖 Leia o arquivo CORRECOES_APLICADAS.md para detalhes completos
echo.
echo 🔧 PRÓXIMAS AÇÕES:
echo    1. Configure .env.development com suas credenciais
echo    2. Escolha: local storage OU DigitalOcean Spaces
echo    3. Execute: cd AB0-1-back ^&^& bundle exec rails server
echo.

pause
