param(
    [Parameter(Mandatory=$true)]
    [string]$BlueprintName
)

$ErrorActionPreference = "Stop"

# Detectar a raiz do projeto (um nível acima da pasta deste script)
$ScriptFolder = $PSScriptRoot
$ProjectRoot = Split-Path $ScriptFolder -Parent
$DestDir = Join-Path $HOME "blueprints\$BlueprintName"

Write-Host "🚀 Raiz do projeto detectada: $ProjectRoot" -ForegroundColor Gray
Write-Host "🚀 Iniciando geração do blueprint: $BlueprintName..." -ForegroundColor Cyan

# 1. Criar estrutura de diretórios
if (Test-Path $DestDir) {
    Write-Host "🧹 Limpando blueprint antigo em $DestDir..." -ForegroundColor Gray
    Remove-Item -Recurse -Force $DestDir
}
New-Item -ItemType Directory -Path (Join-Path $DestDir "back-end") | Out-Null
New-Item -ItemType Directory -Path (Join-Path $DestDir "front-end") | Out-Null
New-Item -ItemType Directory -Path (Join-Path $DestDir "infrastructure") | Out-Null

# Função para copiar ignorando pastas pesadas
function Copy-Filtered {
    param($Source, $Destination, $ExcludeList)
    if (!(Test-Path $Source)) {
        Write-Warning "Pasta não encontrada: $Source. Pulando..."
        return
    }
    
    Get-ChildItem -Path $Source -Recurse | Where-Object {
        $path = $_.FullName
        $exclude = $false
        foreach ($item in $ExcludeList) {
            if ($path -like "*\$item*" -or $path -like "*\.$item*") { $exclude = $true; break }
        }
        $exclude -eq $false
    } | Copy-Item -Destination {
        $relPath = $_.FullName.Replace($Source, "")
        $target = Join-Path $Destination $relPath
        $parent = Split-Path $target
        if (!(Test-Path $parent)) { New-Item -ItemType Directory -Path $parent | Out-Null }
        $target
    } -ErrorAction SilentlyContinue
}

$Excludes = @("node_modules", "tmp", "log", ".git", "out", "build", ".next", "storage", ".env")

# 2. Copiar Backend
Write-Host "📦 Copiando Back-end..." -ForegroundColor Yellow
Copy-Filtered -Source (Join-Path $ProjectRoot "AB0-1-back") -Destination (Join-Path $DestDir "back-end") -ExcludeList $Excludes

# 3. Copiar Frontend
Write-Host "📦 Copiando Front-end..." -ForegroundColor Yellow
Copy-Filtered -Source (Join-Path $ProjectRoot "AB0-1-front") -Destination (Join-Path $DestDir "front-end") -ExcludeList $Excludes

# 4. Copiar Infra Root
Write-Host "📦 Copiando Infraestrutura..." -ForegroundColor Yellow
Copy-Item (Join-Path $ProjectRoot "docker-compose*.yml") -Destination (Join-Path $DestDir "infrastructure") -ErrorAction SilentlyContinue
Copy-Item (Join-Path $ProjectRoot "Makefile") -Destination (Join-Path $DestDir "infrastructure") -ErrorAction SilentlyContinue
Copy-Item (Join-Path $ProjectRoot "README.md") -Destination (Join-Path $DestDir "blueprint-readme.md") -ErrorAction SilentlyContinue

# 5. Generalização (Search and Replace)
Write-Host "🧹 Generalizando nomes (Search & Replace)..." -ForegroundColor Magenta
$FilesToProcess = Get-ChildItem -Path $DestDir -Recurse -File | Where-Object {
    $_.Extension -match "\.(rb|yml|js|ts|tsx|json|md|sh|ps1)$" -or $_.Name -like "Dockerfile*" -or $_.Name -like "Gemfile*"
}

foreach ($file in $FilesToProcess) {
    try {
        $content = Get-Content $file.FullName -Raw -ErrorAction SilentlyContinue
        if ($null -ne $content) {
            $content = $content -replace "AB0-1", "{{PROJECT_NAME_KEBAB}}"
            $content = $content -replace "ab0_1", "{{PROJECT_NAME_SNAKE}}"
            $content = $content -replace "AB0_1", "{{PROJECT_NAME_UPPER}}"
            $content | Set-Content $file.FullName
        }
    } catch {
        Write-Warning "Não foi possível processar o arquivo: $($file.Name)"
    }
}

# 6. Copiar scripts de suporte da pasta original do script
Copy-Item (Join-Path $ScriptFolder "replicate.ps1") -Destination $DestDir
Copy-Item (Join-Path $ScriptFolder "README-BLUEPRINT.md") -Destination (Join-Path $DestDir "README.md")

Write-Host "✅ Blueprint '$BlueprintName' gerado com sucesso em: $DestDir" -ForegroundColor Green
Write-Host "Para criar um novo projeto, vá até a pasta do blueprint e use:" -ForegroundColor White
Write-Host ".\replicate.ps1 -NewProjectName 'nome-do-projeto'" -ForegroundColor Cyan
