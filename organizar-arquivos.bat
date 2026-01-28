@echo off
chcp 65001 >nul
echo ╔═══════════════════════════════════════════════════════════╗
echo ║     📁 ORGANIZAR ARQUIVOS DE DOCUMENTAÇÃO                 ║
echo ╚═══════════════════════════════════════════════════════════╝
echo.

cd /d "%~dp0"

echo Criando estrutura de pastas...
echo.

REM Criar pastas
if not exist "docs\fixes" mkdir "docs\fixes"
if not exist "docs\oauth" mkdir "docs\oauth"
if not exist "scripts\setup" mkdir "scripts\setup"
if not exist "scripts\validation" mkdir "scripts\validation"
if not exist "scripts\testing" mkdir "scripts\testing"

echo [1/4] Movendo documentação de correções...
move "CORRECOES_APLICADAS.md" "docs\fixes\" 2>nul
move "INICIO_RAPIDO_CORRECOES.md" "docs\fixes\" 2>nul
move "RESUMO_VISUAL_CORRECOES.txt" "docs\fixes\" 2>nul
move "status_correcoes.txt" "docs\fixes\" 2>nul

echo [2/4] Movendo documentação OAuth...
move "OAUTH_IMPLEMENTATION_COMPLETE.md" "docs\oauth\" 2>nul
move "OAUTH_SUMMARY_VISUAL.txt" "docs\oauth\" 2>nul

echo [3/4] Movendo scripts de setup...
move "aplicar-correcoes.bat" "scripts\setup\" 2>nul
move "configurar-storage.bat" "scripts\setup\" 2>nul
move "install-oauth-gems.bat" "scripts\setup\" 2>nul

echo [4/4] Movendo scripts de validação e testes...
move "validate-oauth-implementation.bat" "scripts\validation\" 2>nul
move "testar-correcoes.bat" "scripts\testing\" 2>nul
move "test-oauth-complete.bat" "scripts\testing\" 2>nul
move "test-oauth-quick.bat" "scripts\testing\" 2>nul

echo.
echo ✅ Arquivos organizados!
echo.
echo 📁 Estrutura criada:
echo.
echo    docs/
echo    ├── fixes/
echo    │   ├── CORRECOES_APLICADAS.md
echo    │   ├── INICIO_RAPIDO_CORRECOES.md
echo    │   ├── RESUMO_VISUAL_CORRECOES.txt
echo    │   └── status_correcoes.txt
echo    │
echo    └── oauth/
echo        ├── OAUTH_IMPLEMENTATION_COMPLETE.md
echo        └── OAUTH_SUMMARY_VISUAL.txt
echo.
echo    scripts/
echo    ├── setup/
echo    │   ├── aplicar-correcoes.bat
echo    │   ├── configurar-storage.bat
echo    │   └── install-oauth-gems.bat
echo    │
echo    ├── validation/
echo    │   └── validate-oauth-implementation.bat
echo    │
echo    └── testing/
echo        ├── testar-correcoes.bat
echo        ├── test-oauth-complete.bat
echo        └── test-oauth-quick.bat
echo.
echo 🚀 Agora você pode fazer commit:
echo    git add docs/ scripts/
echo    git commit -m "docs: organizar documentação e scripts"
echo.
pause
