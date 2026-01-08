@echo off
echo ==========================================
echo GIT COMMIT ^& PUSH - Fix Imagens 404
echo ==========================================
echo.

REM 1. Verificar status
echo 1. Verificando status do repositorio...
git status
echo.

REM 2. Adicionar TODOS os arquivos de correção de banners E imagens 404
echo 2. Adicionando arquivos ao staging...

REM Backend - Scripts
git add AB0-1-back\check_and_create_banners.rb
git add AB0-1-back\create_test_banners.rb
git add AB0-1-back\check_active_storage.rb
git add AB0-1-back\fix_active_storage_images.rb

REM Frontend - Componentes
git add AB0-1-front\hooks\useBanners.ts
git add AB0-1-front\components\BannerByLocation.tsx
git add AB0-1-front\components\BannerPlaceholder.tsx
git add AB0-1-front\components\CategoriesIndexWithSidebar.tsx

REM Documentação
git add FIX_BANNERS_NAO_RENDERIZAM.md
git add SOLUCAO_COMPLETA_BANNERS.md
git add RESUMO_FIX_BANNERS.md
git add FIX_IMAGENS_404.md

REM Scripts executáveis
git add verificar-banners.bat
git add criar-banners-teste.bat
git add diagnosticar-imagens-404.bat
git add corrigir-imagens-404.bat

REM Git scripts
git add git-commit-push-fix-banners.bat
git add git-commit-push-fix-banners.sh
git add git-commit-push-completo.bat

echo    * Arquivos adicionados
echo.

REM 3. Verificar o que será commitado
echo 3. Arquivos que serao commitados:
git status --short
echo.

REM 4. Fazer commit
echo 4. Criando commit...
git commit -m "fix: Corrige renderizacao de banners e imagens 404 em todos dispositivos" -m "PROBLEMA 1 - BANNERS NAO APARECEM:" -m "- API retornava Array(0)" -m "- Nao havia banners cadastrados/aprovados no banco" -m "" -m "PROBLEMA 2 - IMAGENS 404:" -m "- Active Storage retornava 404 para todas as imagens" -m "- Categorias, empresas e banners sem imagens fisicas" -m "- Blobs orfaos no banco de dados" -m "" -m "FRONTEND - MELHORIAS:" -m "- Hook useBanners com suporte a filtros (position, limit)" -m "- Componente BannerPlaceholder para fallback visual" -m "- CategoriesIndexWithSidebar sempre mostra area de banners" -m "- Melhor tratamento de erros e loading states" -m "- onError handler para imagens quebradas" -m "" -m "BACKEND - SCRIPTS CRIADOS:" -m "- create_test_banners.rb: Cria banners de teste automaticamente" -m "- check_and_create_banners.rb: Diagnostico de banners" -m "- check_active_storage.rb: Diagnostico completo de imagens 404" -m "- fix_active_storage_images.rb: Corrige imagens 404 automaticamente" -m "" -m "SCRIPTS EXECUTAVEIS (Windows):" -m "- criar-banners-teste.bat: Cria banners" -m "- verificar-banners.bat: Diagnostica banners" -m "- diagnosticar-imagens-404.bat: Diagnostica imagens 404" -m "- corrigir-imagens-404.bat: Corrige imagens 404" -m "" -m "DOCUMENTACAO COMPLETA:" -m "- FIX_BANNERS_NAO_RENDERIZAM.md: Diagnostico inicial" -m "- SOLUCAO_COMPLETA_BANNERS.md: Guia detalhado de banners" -m "- RESUMO_FIX_BANNERS.md: Resumo executivo" -m "- FIX_IMAGENS_404.md: Guia completo de imagens 404" -m "" -m "SOLUCOES IMPLEMENTADAS:" -m "1. Scripts automaticos para criar banners com placeholders" -m "2. Scripts automaticos para recriar imagens quebradas" -m "3. Melhor UX no frontend com fallbacks visuais" -m "4. Documentacao completa com multiplas solucoes" -m "5. Tratamento robusto de erros em toda a aplicacao"
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
echo PROXIMOS PASSOS IMPORTANTES:
echo.
echo 1. CORRIGIR IMAGENS 404:
echo    Execute: corrigir-imagens-404.bat
echo.
echo 2. CRIAR BANNERS:
echo    Execute: criar-banners-teste.bat
echo.
echo 3. TESTAR:
echo    - API: curl "https://api.avaliasolar.com.br/api/v1/categories"
echo    - Frontend: https://avaliasolar.com.br/categories
echo    - Console (F12): Verificar se nao ha mais 404
echo.
echo 4. DEPLOY PARA PRODUCAO
echo.
echo ==========================================

pause
