@echo off
echo ==========================================
echo FIX FINANCING - Execucao Direta
echo ==========================================
echo.
cd /d "%~dp0"
rails runner fix_financing_inline.rb
echo.
echo ==========================================
echo Pressione qualquer tecla para fechar...
pause >nul
