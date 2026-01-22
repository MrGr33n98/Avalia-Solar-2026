@echo off
REM ========================================
REM Fix Upload Errors - Use Local Storage
REM ========================================

echo.
echo ========================================
echo   FIX UPLOAD - Usar Armazenamento Local
echo ========================================
echo.

cd /d "%~dp0"

REM 1. Criar diretório storage se não existir
echo [1/5] Criando diretorio storage...
if not exist "AB0-1-back\storage" mkdir "AB0-1-back\storage"
echo ✓ Diretorio criado

REM 2. Backup do arquivo production.rb
echo.
echo [2/5] Fazendo backup de production.rb...
copy "AB0-1-back\config\environments\production.rb" "AB0-1-back\config\environments\production.rb.backup"
echo ✓ Backup criado

REM 3. Modificar production.rb para usar local storage
echo.
echo [3/5] Configurando Active Storage para 'local'...
powershell -Command "(Get-Content 'AB0-1-back\config\environments\production.rb') -replace 'config.active_storage.service = :spaces', 'config.active_storage.service = :local' | Set-Content 'AB0-1-back\config\environments\production.rb'"
echo ✓ Configuracao atualizada

REM 4. Adicionar método ready_for_activation? no model Company
echo.
echo [4/5] Adicionando metodo ready_for_activation? no model...
echo.

REM Criar arquivo temporário com o método
echo   # Metodo para validar ativacao >> temp_method.txt
echo   def ready_for_activation? >> temp_method.txt
echo     name.present? ^&^& email.present? ^&^& (cnpj.present? ^|^| website.present?) >> temp_method.txt
echo   end >> temp_method.txt

REM Adicionar ao final do model (antes do último 'end')
powershell -Command "$content = Get-Content 'AB0-1-back\app\models\company.rb'; $method = Get-Content 'temp_method.txt'; $content[-1] = ($method -join \"`n\") + \"`n\" + $content[-1]; $content | Set-Content 'AB0-1-back\app\models\company.rb'"
del temp_method.txt
echo ✓ Metodo adicionado

REM 5. Reiniciar backend
echo.
echo [5/5] Reiniciando backend...
docker-compose restart backend

echo.
echo ========================================
echo   CORRECAO CONCLUIDA!
echo ========================================
echo.
echo Aguarde 30 segundos para o backend reiniciar...
timeout /t 30 /nobreak > nul

echo.
echo ✓ Backend reiniciado
echo.
echo Teste agora:
echo 1. Acesse: https://api.avaliasolar.com.br/admin
echo 2. Faca upload de uma imagem em Categories
echo 3. Deve funcionar sem erro 500
echo.
echo ========================================

pause
