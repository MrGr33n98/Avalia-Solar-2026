@echo off
echo ========================================
echo TESTE DE BANNERS - Avalia Solar
echo ========================================
echo.

echo 1. Testando API de banners (todos):
curl -s "https://api.avaliasolar.com.br/api/v1/banners" | jq .
echo.
echo.

echo 2. Testando por posicao HOME_TOP:
curl -s "https://api.avaliasolar.com.br/api/v1/banners?position=home_top" | jq .
echo.
echo.

echo 3. Testando por posicao CATEGORIES_TOP:
curl -s "https://api.avaliasolar.com.br/api/v1/banners?position=categories_top" | jq .
echo.
echo.

echo 4. Testando por posicao COMPANIES_TOP:
curl -s "https://api.avaliasolar.com.br/api/v1/banners?position=companies_top" | jq .
echo.
echo.

echo ========================================
echo PROXIMOS PASSOS:
echo ========================================
echo.
echo Se retornar array vazio [], voce precisa:
echo.
echo 1. Acessar: https://api.avaliasolar.com.br/admin/banners
echo 2. Clicar em "New Banner"
echo 3. Preencher:
echo    - Title: Banner Homepage
echo    - Position: home_top
echo    - Banner Type: rectangular_large
echo    - Status: Active
echo    - Upload uma imagem (1200x400px)
echo 4. Save
echo.
echo Repita para as posicoes:
echo    - categories_top
echo    - companies_top
echo.
echo ========================================

pause
