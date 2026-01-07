@echo off
REM Script Windows para commit e push das correções de banners

echo ==========================================
echo GIT COMMIT ^& PUSH - Fix Banners
echo ==========================================
echo.

REM 1. Verificar status
echo 1. Verificando status do repositorio...
git status
echo.

REM 2. Adicionar arquivos novos e modificados
echo 2. Adicionando arquivos ao staging...
git add AB0-1-back\check_and_create_banners.rb
git add FIX_BANNERS_NAO_RENDERIZAM.md
git add verificar-banners.bat
git add git-commit-push-fix-banners.bat
git add git-commit-push-fix-banners.sh
echo    * Arquivos adicionados
echo.

REM 3. Verificar o que será commitado
echo 3. Arquivos que serao commitados:
git status --short
echo.

REM 4. Fazer commit
echo 4. Criando commit...
git commit -m "fix: Adiciona diagnostico e ferramentas para corrigir problema de renderizacao de banners" -m "- Cria script check_and_create_banners.rb para verificar e diagnosticar banners" -m "- Adiciona guia completo FIX_BANNERS_NAO_RENDERIZAM.md com solucoes" -m "- Cria verificar-banners.bat para execucao rapida no Windows" -m "- Identifica causa: API retorna array vazio porque nao ha banners com status approved" -m "- Fornece multiplas opcoes de solucao: script, console Rails, admin panel" -m "" -m "Problema: Frontend recebia Array(0) da API /banners?position=categories_top" -m "Causa: Banners nao atendem criterios do scope currently_active" -m "Solucao: Criar banners com active=true, moderation_status=approved e imagem anexada"
echo    * Commit criado
echo.

REM 5. Push para o repositório remoto
echo 5. Enviando para o repositorio remoto...
echo    Executando: git push origin main
git push origin main
echo.

echo ==========================================
echo * CONCLUIDO!
echo ==========================================
echo.
echo Proximos passos:
echo 1. Execute: verificar-banners.bat
echo 2. Ou acesse: https://api.avaliasolar.com.br/admin/banners
echo 3. Crie banners com position='categories_top'
echo.

pause
