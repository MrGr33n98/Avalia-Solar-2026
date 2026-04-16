# Script PowerShell para Import de Workflows n8n
# Alternativa ao script Node.js

$N8N_URL = if ($env:N8N_URL) { $env:N8N_URL } else { "https://n8n.avaliasolar.com.br" }
$N8N_API_TOKEN = if ($env:N8N_API_KEY) { $env:N8N_API_KEY } elseif ($env:N8N_API_TOKEN) { $env:N8N_API_TOKEN } else { "" }
$WORKFLOWS_DIR = if ($env:WORKFLOWS_DIR) { $env:WORKFLOWS_DIR } else { $PSScriptRoot }

if ([string]::IsNullOrWhiteSpace($N8N_API_TOKEN)) {
    Write-Host "❌ Missing N8N_API_KEY or N8N_API_TOKEN environment variable." -ForegroundColor Red
    Write-Host "   Example: `$env:N8N_URL='http://localhost:5678'; `$env:N8N_API_KEY='your_key'; .\import-workflows.ps1" -ForegroundColor Yellow
    exit 1
}

Write-Host "🚀 ============================================" -ForegroundColor Green
Write-Host "   IMPORT DE WORKFLOWS N8N" -ForegroundColor Green
Write-Host "============================================`n" -ForegroundColor Green

Write-Host "📍 Servidor: $N8N_URL" -ForegroundColor Cyan
Write-Host "📁 Diretório: $WORKFLOWS_DIR`n" -ForegroundColor Cyan

# Headers para API
$headers = @{
    "Content-Type" = "application/json"
    "X-N8N-API-KEY" = $N8N_API_TOKEN
}

# Listar workflows JSON
$workflowFiles = Get-ChildItem -Path $WORKFLOWS_DIR -Filter "WF-*.json"

if ($workflowFiles.Count -eq 0) {
    Write-Host "❌ Nenhum workflow JSON encontrado!" -ForegroundColor Red
    exit 1
}

Write-Host "📦 Encontrados $($workflowFiles.Count) workflows para importar`n" -ForegroundColor Yellow
Write-Host "⏳ Iniciando import...`n" -ForegroundColor Yellow

$results = @()

foreach ($file in $workflowFiles) {
    Write-Host "`n📦 Importando: $($file.Name)" -ForegroundColor Cyan
    
    try {
        # Ler workflow JSON
        $workflowData = Get-Content $file.FullName -Raw | ConvertFrom-Json
        $workflowName = $workflowData.name
        
        Write-Host "  🔍 Verificando se workflow já existe..." -ForegroundColor Gray
        
        # Buscar workflows existentes
        $existingWorkflows = Invoke-RestMethod -Uri "$N8N_URL/api/v1/workflows" -Method GET -Headers $headers
        $existing = $existingWorkflows.data | Where-Object { $_.name -eq $workflowName }
        
        if ($existing) {
            Write-Host "  ⚠️  Workflow '$workflowName' já existe (ID: $($existing.id))" -ForegroundColor Yellow
            Write-Host "  🔄 Atualizando..." -ForegroundColor Gray
            
            # Atualizar workflow
            $body = $workflowData | ConvertTo-Json -Depth 100 -Compress
            $updated = Invoke-RestMethod -Uri "$N8N_URL/api/v1/workflows/$($existing.id)" -Method PUT -Headers $headers -Body $body
            
            Write-Host "  ✅ Atualizado com sucesso! (ID: $($updated.id))" -ForegroundColor Green
            $results += @{
                status = "updated"
                id = $updated.id
                name = $workflowName
                file = $file.Name
            }
        }
        else {
            Write-Host "  ➕ Criando novo workflow..." -ForegroundColor Gray
            
            # Criar novo workflow
            $body = $workflowData | ConvertTo-Json -Depth 100 -Compress
            $created = Invoke-RestMethod -Uri "$N8N_URL/api/v1/workflows" -Method POST -Headers $headers -Body $body
            
            Write-Host "  ✅ Criado com sucesso! (ID: $($created.id))" -ForegroundColor Green
            $results += @{
                status = "created"
                id = $created.id
                name = $workflowName
                file = $file.Name
            }
        }
    }
    catch {
        Write-Host "  ❌ Erro ao importar: $($_.Exception.Message)" -ForegroundColor Red
        $results += @{
            status = "error"
            name = $file.Name
            error = $_.Exception.Message
        }
    }
    
    # Aguardar 1 segundo entre imports
    Start-Sleep -Seconds 1
}

# Sumário final
Write-Host "`n`n📊 ============================================" -ForegroundColor Green
Write-Host "   SUMÁRIO DO IMPORT" -ForegroundColor Green
Write-Host "============================================`n" -ForegroundColor Green

$created = ($results | Where-Object { $_.status -eq "created" }).Count
$updated = ($results | Where-Object { $_.status -eq "updated" }).Count
$errors = ($results | Where-Object { $_.status -eq "error" }).Count

Write-Host "✅ Criados: $created" -ForegroundColor Green
Write-Host "🔄 Atualizados: $updated" -ForegroundColor Yellow
Write-Host "❌ Erros: $errors" -ForegroundColor Red
Write-Host "📊 Total: $($results.Count)`n" -ForegroundColor White

if ($errors -gt 0) {
    Write-Host "❌ Workflows com erro:" -ForegroundColor Red
    $results | Where-Object { $_.status -eq "error" } | ForEach-Object {
        Write-Host "  • $($_.name): $($_.error)" -ForegroundColor Red
    }
    Write-Host ""
}

Write-Host "✨ Import concluído!" -ForegroundColor Green
Write-Host "============================================`n" -ForegroundColor Green

Write-Host "🔗 Acesse seus workflows em:" -ForegroundColor Cyan
Write-Host "   $N8N_URL/workflows`n" -ForegroundColor White

# Listar workflows importados com sucesso
Write-Host "📋 Workflows importados:" -ForegroundColor Cyan
$results | Where-Object { $_.status -ne "error" } | ForEach-Object {
    $statusIcon = if ($_.status -eq "created") { "➕" } else { "🔄" }
    Write-Host "  $statusIcon $($_.name) (ID: $($_.id))" -ForegroundColor White
}

Write-Host ""
