@echo off
REM Script de teste para os novos endpoints de Categorias e Banners
REM Uso: test-categories-refactor.bat

setlocal enabledelayedexpansion

if "%API_URL%"=="" (
    set BASE_URL=http://localhost:3001/api/v1
) else (
    set BASE_URL=%API_URL%
)

echo ========================================
echo Testando Refatoracao da Pagina de Categorias
echo ========================================
echo.

echo 1. BANNERS
echo ----------------------------------------
echo.

echo [Teste 1] Todos os banners ativos
echo GET %BASE_URL%/banners
curl -s "%BASE_URL%/banners"
echo.
echo.

echo [Teste 2] Banners da pagina de categorias
echo GET %BASE_URL%/banners?position=categories_top
curl -s "%BASE_URL%/banners?position=categories_top"
echo.
echo.

echo [Teste 3] Banners com limite
echo GET %BASE_URL%/banners?position=categories_top^&limit=3
curl -s "%BASE_URL%/banners?position=categories_top&limit=3"
echo.
echo.

echo 2. CATEGORIAS
echo ----------------------------------------
echo.

echo [Teste 4] Categorias (modo legado)
echo GET %BASE_URL%/categories
curl -s "%BASE_URL%/categories"
echo.
echo.

echo [Teste 5] Categorias (modo cards)
echo GET %BASE_URL%/categories?view=cards
curl -s "%BASE_URL%/categories?view=cards"
echo.
echo.

echo [Teste 6] Categorias em destaque
echo GET %BASE_URL%/categories?view=cards^&featured=true
curl -s "%BASE_URL%/categories?view=cards&featured=true"
echo.
echo.

echo [Teste 7] Categorias em destaque (limite 8)
echo GET %BASE_URL%/categories?view=cards^&featured=true^&limit=8
curl -s "%BASE_URL%/categories?view=cards&featured=true&limit=8"
echo.
echo.

echo ========================================
echo Testes concluidos!
echo.
echo Dicas:
echo   - Se algum teste falhar, verifique se o backend esta rodando
echo   - Verifique se ha dados no banco (banners, categorias)
echo   - Logs do backend: AB0-1-back\log\development.log
echo ========================================

pause
