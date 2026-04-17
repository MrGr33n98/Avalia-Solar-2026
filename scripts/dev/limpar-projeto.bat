@echo off
chcp 65001 >nul
echo ========================================
echo 🧹 LIMPEZA DO PROJETO AB0-1
echo ========================================
echo.
echo Este script irá deletar arquivos temporários e duplicados
echo.
echo ⚠️  ATENÇÃO: Esta ação é IRREVERSÍVEL!
echo.
echo Arquivos a serem deletados:
echo   - Backups de .env (2 arquivos)
echo   - Scripts temporários .bat e .sh (~60 arquivos)
echo   - Documentação duplicada (~30 arquivos)
echo   - Arquivos temporários (logs, reports, etc)
echo.
set /p confirm="Deseja continuar? (S/N): "
if /i not "%confirm%"=="S" (
    echo.
    echo ❌ Operação cancelada pelo usuário
    pause
    exit /b
)

echo.
echo 📦 Criando backup de segurança...
set BACKUP_DIR=backup_limpeza_%date:~-4%%date:~3,2%%date:~0,2%_%time:~0,2%%time:~3,2%%time:~6,2%
set BACKUP_DIR=%BACKUP_DIR: =0%
mkdir "%BACKUP_DIR%" 2>nul

echo.
echo 🗑️  Deletando backups antigos de .env...
if exist .env.backup.20260127_120009 (
    move .env.backup.20260127_120009 "%BACKUP_DIR%\" >nul 2>&1
    echo    ✓ .env.backup.20260127_120009
)
if exist .env.backup.20262201_110340 (
    move .env.backup.20262201_110340 "%BACKUP_DIR%\" >nul 2>&1
    echo    ✓ .env.backup.20262201_110340
)

echo.
echo 🗑️  Deletando scripts BAT temporários...
for %%f in (
    aplicar-protecao.bat
    commit-backend-fix.bat
    commit-e-deploy-restauracao.bat
    commit-fix-ci-build.bat
    commit-fix.bat
    commit-frontend-fix.bat
    corrigir-imagens-404.bat
    create-analytics-dir.bat
    create-logout-dir.bat
    criar-banners-teste.bat
    deploy-com-spaces.bat
    deploy-push.bat
    diagnosticar-imagens-404.bat
    fix-category-model.bat
    fix-deploy-proteger-dados.bat
    fix-financing-now.bat
    fix-frontend-build.bat
    fix-spaces-credentials.bat
    fix-timeout-deploy.bat
    fix-upload-local.bat
    fix-upload-spaces.bat
    generate_secrets.bat
    git-commit-push-completo.bat
    git-commit-push-fix-banners.bat
    organizar-arquivos.bat
    protecao-completa-dados.bat
    restaurar-dados-backup.bat
    run-financing-diagnostic.bat
    seed-financing-options.bat
    setup-2fa-dirs.bat
    start-redis.bat
    stop-redis.bat
    test-banners.bat
    test-build-diagnostico.bat
    test-categories-refactor.bat
    test-company-upload.bat
    test-frontend-build.bat
    validate-jwt-revocation.bat
    verificar-banners.bat
) do (
    if exist "%%f" (
        move "%%f" "%BACKUP_DIR%\" >nul 2>&1
        echo    ✓ %%f
    )
)

echo.
echo 🗑️  Deletando scripts SH temporários...
for %%f in (
    check-postgres-status.sh
    cleanup.sh
    collect-null-errors.sh
    COMO_FAZER_DEPLOY.sh
    compilar-assets.sh
    deploy-automatico.sh
    deploy-fix.sh
    diagnose-nextjs-error.sh
    diagnostico-erro.sh
    fix-database-user.sh
    fix-nextjs-digest.sh
    fix-postgres-auth.sh
    fix-s3-credentials.sh
    fix_vm_network_health.sh
    force-fix-nextjs.sh
    init-db.sh
    quick-fix-cache.sh
    setup.sh
    test-categories-refactor.sh
    test-frontend-build.sh
    test-integration.sh
    validate-config.sh
    validate-jwt-revocation.sh
    vm-health-check.sh
) do (
    if exist "%%f" (
        move "%%f" "%BACKUP_DIR%\" >nul 2>&1
        echo    ✓ %%f
    )
)

echo.
echo 🗑️  Deletando scripts PowerShell temporários...
for %%f in (
    collect_summary.ps1
    fix-deploy-script.ps1
    generate-category-analysis.ps1
    run-script-vm.ps1
) do (
    if exist "%%f" (
        move "%%f" "%BACKUP_DIR%\" >nul 2>&1
        echo    ✓ %%f
    )
)

echo.
echo 🗑️  Deletando documentação duplicada/temporária...
for %%f in (
    BACKUP_RESTAURACAO_GUIA.md
    CRIAR_BUCKET_SPACES_URGENTE.md
    DIAGNOSTICO_COMPLETO_CADASTRO_AUTH_MULTIEMPRESA.md
    DIAGNOSTICO_UPLOAD_ERROR.md
    FASE1_IMPLEMENTACAO.md
    FASE1_SUMMARY.md
    FIX_UPLOAD_ERRORS.md
    FIXES_SUMMARY.md
    FRONTEND_BUILD_ERROR_FIX.md
    FRONTEND_BUILD_FIX.md
    HISTORIA_AVALIA_SOLAR.md
    IMPLEMENTACAO_COMPLETA.md
    IMPLEMENTATION_SUMMARY.md
    INDEX.md
    INSTALAR_REDIS_WINDOWS.md
    INSTRUCOES_URGENTES.txt
    INSTRUCOES_VM.md
    OTIMIZACAO_DEPLOY.md
    PROMPT_FIX_BANNERS_404.md
    promt.md
    QUICK_FIX_CHECKLIST.md
    QUICK_START_CICD.md
    QUICK_START_GUIDE.md
    relatorio_redesign.md
    SENIOR_IMPROVEMENTS_FINAL.md
    SETUP_DIGITALOCEAN_SPACES.md
    SOLUCAO_COMPLETA_DADOS.md
    SOLUCAO_UPLOAD_S3.md
    SOLUCOES_APLICADAS.md
    sumario-improvement.md
    sumpario-improvement-categorycar.md
    task0-test.md
) do (
    if exist "%%f" (
        move "%%f" "%BACKUP_DIR%\" >nul 2>&1
        echo    ✓ %%f
    )
)

echo.
echo 🗑️  Deletando arquivos temporários diversos...
for %%f in (
    act.tar.gz
    blog-promt-.mp
    er.email
    history.txt
    lighthouse_report.json
    log.md
    typescript
    docker
    _map.bin
) do (
    if exist "%%f" (
        move "%%f" "%BACKUP_DIR%\" >nul 2>&1
        echo    ✓ %%f
    )
)

echo.
echo ========================================
echo ✅ LIMPEZA CONCLUÍDA!
echo ========================================
echo.
echo 📊 Resumo:
echo    • Arquivos movidos para: %BACKUP_DIR%\
echo    • Se tudo estiver OK, delete a pasta de backup manualmente
echo    • Para restaurar, copie os arquivos de volta
echo.
echo 💡 Próximos passos recomendados:
echo    1. Teste o projeto: docker-compose up
echo    2. Se funcionar, delete: %BACKUP_DIR%
echo    3. Commit as mudanças: git add -A ^&^& git commit -m "chore: clean project structure"
echo.
pause
