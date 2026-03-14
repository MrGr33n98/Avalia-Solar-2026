param(
    [Parameter(Mandatory=$true)]
    [string]$NewProjectName
)

$ErrorActionPreference = "Stop"

$BlueprintDir = $PSScriptRoot
$TargetDir = Join-Path $HOME "novos-projetos\$NewProjectName"

# Conversões de string
$ProjectSnake = $NewProjectName.Replace("-", "_")
$ProjectUpper = $ProjectSnake.ToUpper()
# PascalCase (Simples)
$ProjectPascal = (Get-Culture).TextInfo.ToTitleCase($NewProjectName.Replace("-", " ")).Replace(" ", "")

Write-Host "🚀 Instanciando novo projeto: $NewProjectName em $TargetDir" -ForegroundColor Cyan

if (Test-Path $TargetDir) {
    Write-Error "A pasta de destino já existe: $TargetDir"
}

mkdir $TargetDir

# 1. Copiar base
Write-Host "📦 Copiando arquivos do blueprint..." -ForegroundColor Yellow
Copy-Item -Path "$BlueprintDir\*" -Destination $TargetDir -Recurse -Exclude "replicate.ps1", "README.md"

# 2. Renomear pastas
Rename-Item -Path (Join-Path $TargetDir "back-end") -NewName "${NewProjectName}-back" -ErrorAction SilentlyContinue
Rename-Item -Path (Join-Path $TargetDir "front-end") -NewName "${NewProjectName}-front" -ErrorAction SilentlyContinue

# 3. Substituir os Placeholders
Write-Host "⚙️ Configurando o projeto com os novos nomes..." -ForegroundColor Magenta
$FilesToProcess = Get-ChildItem -Path $TargetDir -Recurse -File | Where-Object {
    $_.Extension -match "\.(rb|yml|js|ts|tsx|json|md|sh|ps1)$" -or $_.Name -like "Dockerfile*" -or $_.Name -like "Gemfile*"
}

foreach ($file in $FilesToProcess) {
    $content = Get-Content $file.FullName -Raw
    $content = $content -replace "{{PROJECT_NAME_KEBAB}}", $NewProjectName
    $content = $content -replace "{{PROJECT_NAME_SNAKE}}", $ProjectSnake
    $content = $content -replace "{{PROJECT_NAME_UPPER}}", $ProjectUpper
    $content = $content -replace "{{PROJECT_NAME_PASCAL}}", $ProjectPascal
    $content | Set-Content $file.FullName
}

Write-Host "✅ Instanciação concluída! Seu projeto está em: $TargetDir" -ForegroundColor Green
Write-Host ""
Write-Host "Próximos passos recomendados:"
Write-Host "1. cd $TargetDir\${NewProjectName}-back"
Write-Host "2. bundle install && rails db:create db:migrate"
Write-Host "3. cd ..\${NewProjectName}-front"
Write-Host "4. npm install"
Write-Host "5. Boa programação! 🎉" -ForegroundColor Cyan
