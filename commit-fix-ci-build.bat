@echo off
echo ========================================
echo FIX: Docker Build CI/CD - DIAGNOSTICO COMPLETO
echo ========================================
echo.

echo [1/5] Verificando status do Git...
git status --short

echo.
echo [2/5] Adicionando arquivos modificados...
git add Dockerfile.frontend
git add DIAGNOSTICO_COMPLETO_BUILD.md

echo.
echo [3/5] Verificando arquivos staged...
git diff --cached --name-only

echo.
echo [4/5] Fazendo commit...
git commit -m "fix(ci): adiciona diagnostico completo de build errors

Correcoes criticas:
- Usa PIPESTATUS[0] para capturar exit code correto do npm (nao do tee)
- Exibe valores de variaveis com aspas para detectar strings vazias
- Valida variaveis obrigatorias ANTES do build
- Exibe log COMPLETO em caso de erro (cat em vez de tail)
- Melhora formatacao de logs para facilitar leitura

Agora o proximo build vai mostrar:
- Valores exatos de todas as variaveis (vazias ficam obvias)
- Qual variavel especifica esta faltando
- Log completo do erro do Next.js
- Exit code correto

Refs #240"

echo.
echo [5/5] Fazendo push para origin main...
git push origin main

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo ✓ PUSH REALIZADO COM SUCESSO!
    echo ========================================
    echo.
    echo Acompanhe o pipeline em:
    echo https://github.com/MrGr33n98/Avalia-Solar-2026/actions
    echo.
    echo O proximo build VAI MOSTRAR o erro real!
    echo.
) else (
    echo.
    echo ========================================
    echo ✗ ERRO NO PUSH
    echo ========================================
    echo.
)

pause
