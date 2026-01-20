@echo off
echo ==========================================
echo FIX RAPIDO - Financing 500 Error
echo ==========================================
echo.

cd /d "%~dp0AB0-1-back"

echo [1/3] Verificando dados existentes...
rails runner "puts \"Company 1: #{Company.find_by(id: 1)&.name || 'NAO ENCONTRADA'}\"; puts \"Financing Options: #{Company.find_by(id: 1)&.financing_options&.count || 0}\""
echo.

echo [2/3] Criando opcoes de financiamento...
rails runner create_financing_test_data.rb
echo.

echo [3/3] Verificando resultado...
rails runner "c = Company.find(1); puts \"Total de opcoes: #{c.financing_options.count}\"; puts \"Opcoes ativas (PF): #{c.financing_options.active_only.where(target_audience: 'PF').count}\"; puts \"Opcoes ativas (PJ): #{c.financing_options.active_only.where(target_audience: 'PJ').count}\"; puts \"Opcoes ativas (Rural): #{c.financing_options.active_only.where(target_audience: 'Rural').count}\""
echo.

echo ==========================================
echo FIX CONCLUIDO!
echo ==========================================
echo.
echo Proximos passos:
echo 1. Reinicie o Rails server (Ctrl+C e rails s)
echo 2. Teste no browser: http://localhost:3000/companies/1/financing
echo 3. Verifique os logs: tail -f log/development.log
echo.
pause
