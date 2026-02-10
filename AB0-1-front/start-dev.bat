@echo off
REM ====================================================
REM Script de Inicialização Rápida - Avalia Solar
REM ====================================================

echo.
echo ========================================
echo   Avalia Solar - Inicializacao Rapida
echo ========================================
echo.

REM Check if backend directory exists
if not exist "..\AB0-1-back" (
    echo [ERRO] Diretorio do backend nao encontrado!
    echo Esperado: ..\AB0-1-back
    echo.
    pause
    exit /b 1
)

REM Check if .env.local exists
if not exist ".env.local" (
    echo [AVISO] Arquivo .env.local nao encontrado!
    echo Criando a partir do .env.local.example...
    copy .env.local.example .env.local
    echo [OK] Arquivo .env.local criado.
    echo.
)

echo [1/5] Verificando Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERRO] Node.js nao esta instalado!
    echo Baixe em: https://nodejs.org/
    pause
    exit /b 1
)
echo [OK] Node.js instalado
echo.

echo [2/5] Verificando dependencias do frontend...
if not exist "node_modules" (
    echo [AVISO] Dependencias nao instaladas. Instalando...
    call npm install
    if errorlevel 1 (
        echo [ERRO] Falha ao instalar dependencias!
        pause
        exit /b 1
    )
)
echo [OK] Dependencias verificadas
echo.

echo [3/5] Limpando cache do Next.js...
if exist ".next" (
    rmdir /s /q .next 2>nul
    echo [OK] Cache limpo
) else (
    echo [OK] Sem cache para limpar
)
echo.

echo [4/5] Testando conectividade com backend...
echo Testando: http://localhost:3001/api/v1/companies
node diagnose-companies-issue.js
if errorlevel 1 (
    echo.
    echo [AVISO] Backend pode nao estar rodando!
    echo.
    echo Para iniciar o backend:
    echo   1. Abra outro terminal
    echo   2. cd ..\AB0-1-back
    echo   3. rails server -p 3001
    echo.
    choice /C SN /M "Deseja continuar mesmo assim"
    if errorlevel 2 exit /b 1
)
echo.

echo [5/5] Iniciando servidor de desenvolvimento...
echo.
echo ========================================
echo Frontend iniciando em:
echo   http://localhost:3000
echo.
echo Pagina de empresas:
echo   http://localhost:3000/companies
echo ========================================
echo.
echo Pressione Ctrl+C para parar o servidor
echo.

npm run dev
