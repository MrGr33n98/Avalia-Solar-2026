@echo off
echo ================================================================================
echo VERIFICACAO DE BANNERS - Avalia Solar
echo ================================================================================
echo.

cd AB0-1-back

echo Verificando banners no banco de dados...
echo.

bundle exec ruby check_and_create_banners.rb

echo.
echo ================================================================================
echo.
echo Proximos passos:
echo 1. Se nao houver banners, acesse o admin panel para criar
echo 2. Admin panel: https://api.avaliasolar.com.br/admin/banners
echo 3. Ou use: bundle exec rails console (dentro de AB0-1-back)
echo.
echo ================================================================================

pause
