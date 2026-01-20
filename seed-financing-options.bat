@echo off
echo === Criando opcoes de financiamento de teste ===
cd /d "%~dp0AB0-1-back"
rails runner db/seeds/financing_options.rb
echo.
echo === Concluido ===
pause
