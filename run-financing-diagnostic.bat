@echo off
cd /d "%~dp0AB0-1-back"
echo === Executando diagnostico de financiamento ===
ruby diagnose_financing.rb
pause
