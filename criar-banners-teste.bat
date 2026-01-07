@echo off
echo ================================================================================
echo CRIAR BANNERS DE TESTE - Avalia Solar
echo ================================================================================
echo.
echo Este script vai:
echo 1. Criar banners de teste para todas as posicoes (categories_top, navbar, sidebar)
echo 2. Baixar imagens placeholder do via.placeholder.com
echo 3. Configurar os banners como ativos e aprovados
echo.
echo ================================================================================
echo.

cd AB0-1-back

echo Executando script de criacao de banners...
echo.

bundle exec ruby create_test_banners.rb

echo.
echo ================================================================================
echo.
echo Proximos passos:
echo 1. Teste a API: 
echo    curl "https://api.avaliasolar.com.br/api/v1/banners?position=categories_top"
echo.
echo 2. Acesse o frontend:
echo    https://avaliasolar.com.br/categories
echo.
echo 3. Verifique o admin panel:
echo    https://api.avaliasolar.com.br/admin/banners
echo.
echo ================================================================================

pause
