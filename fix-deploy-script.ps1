# Fix deploy workflow script
$ErrorActionPreference = "Stop"

$file = "C:\Users\Bobi\Desktop\AB0-1-main\.github\workflows\deploy-v1.yml"

Write-Host "📝 Corrigindo script de deploy..." -ForegroundColor Cyan

# Ler o conteúdo
$content = Get-Content $file -Raw -Encoding UTF8

# Padrão a substituir
$pattern = [regex]::Escape(@"
            echo "📊 Verificando estado do banco..."
            TABLES_COUNT=$(docker compose exec -T backend bundle exec rails runner "
              begin
                puts ActiveRecord::Base.connection.tables.count
              rescue
                puts '0'
              end
            " 2>/dev/null || echo "0")
            echo "📊 Tabelas encontradas: $TABLES_COUNT"
            
            if [[ "$TABLES_COUNT" -gt 5 ]]; then
              echo "🔄 Banco já populado, executando migrações..."
              docker compose exec -T backend bundle exec rails db:migrate
            else
              echo "🆕 Banco vazio/quase vazio, executando setup..."
              docker compose exec -T -e DISABLE_DATABASE_ENVIRONMENT_CHECK=1 backend bundle exec rails db:setup || {
                echo "⚠️ db:setup falhou, tentando schema:load + seed..."
                docker compose exec -T -e DISABLE_DATABASE_ENVIRONMENT_CHECK=1 backend bundle exec rails db:schema:load || true
                docker compose exec -T backend bundle exec rails db:seed || true
              }
            fi
"@)

$replacement = @"
            echo "📊 Verificando estado do banco..."
            TABLES_COUNT=`$(docker compose exec -T backend bundle exec rails runner "
              begin
                STDOUT.sync = true
                count = ActiveRecord::Base.connection.tables.count
                puts count
              rescue => e
                puts '0'
              end
            " 2>&1 | tail -1 | tr -d '[:space:]')
            echo "📊 Tabelas encontradas: `$TABLES_COUNT"
            
            # Verificar se é número válido
            if ! [[ "`$TABLES_COUNT" =~ ^[0-9]+`$ ]]; then
              echo "⚠️ Contagem inválida, assumindo banco vazio"
              TABLES_COUNT=0
            fi
            
            if [ "`$TABLES_COUNT" -gt 5 ]; then
              echo "🔄 Banco já populado, executando migrações..."
              docker compose exec -T backend bundle exec rails db:migrate
            else
              echo "🆕 Banco vazio/quase vazio, executando migrate..."
              docker compose exec -T backend bundle exec rails db:migrate || {
                echo "⚠️ Migrate falhou, tentando setup..."
                docker compose exec -T -e DISABLE_DATABASE_ENVIRONMENT_CHECK=1 backend bundle exec rails db:setup || true
              }
              docker compose exec -T backend bundle exec rails db:seed || true
            fi
"@

if ($content -match [regex]::Escape('TABLES_COUNT=$(docker compose exec -T backend bundle exec rails runner')) {
    # Encontrar e substituir o bloco
    $lines = $content -split "`r?`n"
    $newLines = @()
    $i = 0
    $skip = $false
    $skipCount = 0
    
    while ($i -lt $lines.Count) {
        if ($lines[$i] -match 'echo "📊 Verificando estado do banco\.\.\."' -and !$skip) {
            # Adicionar o novo bloco
            $newLines += $replacement -split "`n"
            $skip = $true
            $skipCount = 0
        }
        elseif ($skip) {
            $skipCount++
            # Pular as próximas 18 linhas (o bloco antigo)
            if ($skipCount -ge 18) {
                $skip = $false
            }
        }
        else {
            $newLines += $lines[$i]
        }
        $i++
    }
    
    $newContent = $newLines -join "`n"
    [System.IO.File]::WriteAllText($file, $newContent, [System.Text.Encoding]::UTF8)
    
    Write-Host "✅ Script corrigido com sucesso!" -ForegroundColor Green
}
else {
    Write-Host "⚠️ Padrão não encontrado no arquivo" -ForegroundColor Yellow
}
