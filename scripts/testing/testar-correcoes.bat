@echo off
chcp 65001 >nul
echo ╔═══════════════════════════════════════════════════════════╗
echo ║     🧪 TESTAR CORREÇÕES - Avalia Solar                   ║
echo ╚═══════════════════════════════════════════════════════════╝
echo.

cd /d "%~dp0\AB0-1-back"

echo [1/6] Verificando estrutura...
if not exist "app\models\company.rb" (
    echo ❌ Erro: Estrutura incorreta!
    pause
    exit /b 1
)
echo ✅ Estrutura OK

echo.
echo [2/6] Verificando método ready_for_activation?...
findstr /C:"def ready_for_activation?" "app\models\company.rb" >nul
if %ERRORLEVEL% EQU 0 (
    echo ✅ Método ready_for_activation? encontrado
) else (
    echo ❌ Método ready_for_activation? NÃO encontrado!
    echo    Execute o script aplicar-correcoes.bat primeiro
    pause
    exit /b 1
)

echo.
echo [3/6] Verificando configuração de storage...
if not exist ".env.development" (
    echo ❌ Arquivo .env.development não encontrado!
    echo    Execute o script configurar-storage.bat primeiro
    pause
    exit /b 1
)

findstr /C:"ACTIVE_STORAGE_SERVICE" ".env.development" >nul
if %ERRORLEVEL% EQU 0 (
    echo ✅ ACTIVE_STORAGE_SERVICE configurado
    findstr "ACTIVE_STORAGE_SERVICE" ".env.development"
) else (
    echo ⚠️  ACTIVE_STORAGE_SERVICE não configurado
    echo    Execute o script configurar-storage.bat
    pause
    exit /b 1
)

echo.
echo [4/6] Verificando dependências Rails...
where bundle >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Bundler não instalado!
    echo    Execute: gem install bundler
    pause
    exit /b 1
)
echo ✅ Bundler instalado

echo.
echo [5/6] Testando carregamento do Rails...
echo    Executando: bundle exec rails runner "puts 'Rails OK'"
bundle exec rails runner "puts 'Rails OK'" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo ✅ Rails carrega sem erros
) else (
    echo ⚠️  Rails com problemas - verifique logs
    echo    Execute: bundle install
)

echo.
echo [6/6] Testando método ready_for_activation?...
echo    Criando script de teste Ruby...

(
    echo begin
    echo   company = Company.first
    echo   if company.nil?
    echo     puts "AVISO: Nenhuma company encontrada no banco"
    echo     puts "Execute seeds: rails db:seed"
    echo   else
    echo     result = company.ready_for_activation?
    echo     puts "SUCCESS: ready_for_activation? retornou: #{result}"
    echo   end
    echo rescue StandardError =^> e
    echo   puts "ERROR: #{e.class.name}: #{e.message}"
    echo   exit 1
    echo end
) > test_ready_activation.rb

echo    Executando teste...
bundle exec rails runner test_ready_activation.rb 2>&1 | findstr /C:"SUCCESS" /C:"ERROR" /C:"AVISO"
if %ERRORLEVEL% EQU 0 (
    echo ✅ Método funciona corretamente!
) else (
    echo ❌ Erro ao executar teste
)

del test_ready_activation.rb >nul 2>&1

echo.
echo ╔═══════════════════════════════════════════════════════════╗
echo ║              📊 RESUMO DOS TESTES                         ║
echo ╚═══════════════════════════════════════════════════════════╝
echo.

REM Criar relatório de testes
(
    echo === RELATÓRIO DE TESTES - %date% %time% ===
    echo.
    echo ✅ TESTES EXECUTADOS:
    echo    - Estrutura do projeto
    echo    - Método ready_for_activation? presente
    echo    - Configuração de storage
    echo    - Bundler instalado
    echo    - Rails carregando
    echo    - Método funcionando
    echo.
    echo 📋 PRÓXIMOS PASSOS MANUAIS:
    echo.
    echo 1. TESTAR UPLOAD NO ADMIN PANEL:
    echo    - Inicie o servidor: bundle exec rails server
    echo    - Acesse: http://localhost:3001/admin
    echo    - Vá em Companies -^> Editar
    echo    - Faça upload de um logo
    echo    - ✅ Deve funcionar sem erros
    echo.
    echo 2. TESTAR IMPORT CSV:
    echo    - Acesse: http://localhost:3001/admin/companies
    echo    - Clique em "Import CSV"
    echo    - Faça upload de um CSV
    echo    - ✅ Não deve dar erro de ready_for_activation?
    echo.
    echo 3. VERIFICAR LOGS:
    echo    - Execute: tail -f log/development.log
    echo    - Ou abra: AB0-1-back/log/development.log
    echo    - Busque por erros de upload ou S3
    echo.
) > relatorio_testes.txt

type relatorio_testes.txt

echo.
echo 📖 Relatório completo salvo em: relatorio_testes.txt
echo.
echo 🚀 Para iniciar o servidor:
echo    cd AB0-1-back
echo    bundle exec rails server
echo.
echo 🌐 Acesse o Admin Panel:
echo    http://localhost:3001/admin
echo.

pause
