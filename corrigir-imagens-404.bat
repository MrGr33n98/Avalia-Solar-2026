@echo off
echo ================================================================================
echo CORRECAO AUTOMATICA - Imagens 404 do Active Storage
echo ================================================================================
echo.
echo Este script vai:
echo 1. Recriar todas as imagens quebradas (404)
echo 2. Baixar imagens placeholder do via.placeholder.com
echo 3. Limpar blobs orfaos do banco de dados
echo 4. Verificar permissoes da pasta storage/
echo.
echo ATENCAO: Isso pode levar alguns minutos...
echo.
echo ================================================================================
echo.

cd AB0-1-back

echo Executando correcao...
echo.

bundle exec ruby fix_active_storage_images.rb

echo.
echo ================================================================================
echo.
echo Teste agora:
echo 1. Frontend: https://avaliasolar.com.br/categories
echo 2. Verifique se as imagens aparecem
echo 3. Console do browser (F12) nao deve mostrar mais erros 404
echo.
echo ================================================================================

pause
