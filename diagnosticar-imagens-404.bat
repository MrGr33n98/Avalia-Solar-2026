@echo off
echo ================================================================================
echo DIAGNOSTICO DE IMAGENS - Active Storage 404
echo ================================================================================
echo.
echo Este script vai verificar:
echo 1. Configuracao do Active Storage
echo 2. Imagens de categorias (banners)
echo 3. Logos de empresas
echo 4. Imagens de banners publicitarios
echo 5. Blobs orfaos (sem arquivo fisico)
echo.
echo ================================================================================
echo.

cd AB0-1-back

echo Executando diagnostico...
echo.

bundle exec ruby check_active_storage.rb

echo.
echo ================================================================================
echo.
echo Se foram encontrados problemas:
echo 1. Execute: corrigir-imagens-404.bat (para corrigir automaticamente)
echo 2. Ou recrie manualmente via admin panel
echo.
echo ================================================================================

pause
