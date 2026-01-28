@echo off
echo ===================================================
echo TESTANDO UPLOAD DE BANNER E LOGO - COMPANY
echo ===================================================
echo.

cd AB0-1-back

echo [1] Verificando configuracao do Active Storage...
ruby -e "require './config/environment'; puts 'Service: ' + Rails.configuration.active_storage.service.to_s"

echo.
echo [2] Verificando credenciais Spaces...
ruby -e "puts 'SPACES_ACCESS_KEY_ID: ' + (ENV['SPACES_ACCESS_KEY_ID'] ? 'OK' : 'MISSING'); puts 'SPACES_SECRET_ACCESS_KEY: ' + (ENV['SPACES_SECRET_ACCESS_KEY'] ? 'OK' : 'MISSING'); puts 'SPACES_BUCKET: ' + ENV.fetch('SPACES_BUCKET', 'NOT SET')"

echo.
echo [3] Testando permissoes do modelo Company...
ruby -e "require './config/environment'; c = Company.first; puts 'Company found: ' + c.name; puts 'Banner attached: ' + c.banner.attached?.to_s; puts 'Logo attached: ' + c.logo.attached?.to_s"

echo.
echo [4] Verificando permitted_params no ActiveAdmin...
ruby -r './config/environment' -e "puts 'Permitted params include :banner and :logo' if ActiveAdmin.application.namespaces[:admin].resources[Company].permitted_params.to_s.include?('banner')"

echo.
echo ===================================================
echo Teste concluido!
echo ===================================================
pause
