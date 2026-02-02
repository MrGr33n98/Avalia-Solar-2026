@echo off
REM Script para executar o seed de Mobilidade Elétrica
REM Windows Batch Script

echo ================================
echo  Seed de Mobilidade Eletrica
echo ================================
echo.

cd AB0-1-back

echo Verificando ambiente Rails...
call bundle exec rails runner "puts 'Rails: OK'"

echo.
echo Executando seed...
call bundle exec rake db:seed:mobilidade_eletrica

echo.
echo ================================
echo  Concluido!
echo ================================
echo.
echo Para verificar os resultados, execute:
echo   cd AB0-1-back
echo   bundle exec rails console
echo   Category.find_by(seo_url: 'ecossistema-mobilidade-eletrica-brasil')
echo.

pause
