# Script de Diagnostico Completo - AB0-1
# Analisa o projeto completo a partir da raiz

$rootPath = "C:\Users\Bobi\Desktop\AB0-1-main"
$outputFile = Join-Path $rootPath "diagnostico-v1.md"
$frontPath = Join-Path $rootPath "AB0-1-front"
$backPath = Join-Path $rootPath "AB0-1-back"

# Funcao para contar linhas de codigo
function Get-CodeStats {
    param($path, $extensions)
    
    $files = Get-ChildItem -Path $path -Recurse -File -Include $extensions -ErrorAction SilentlyContinue | 
             Where-Object { $_.FullName -notmatch "node_modules|dist|build|coverage|\.next|\.git" }
    
    $totalLines = 0
    $fileCount = $files.Count
    
    foreach ($file in $files) {
        try {
            $lines = (Get-Content $file.FullName -ErrorAction SilentlyContinue).Count
            $totalLines += $lines
        } catch {}
    }
    
    return @{
        Files = $fileCount
        Lines = $totalLines
    }
}

# Funcao para obter estrutura de diretorios
function Get-DirectoryTree {
    param($path, $prefix = "", $isLast = $true)
    
    $items = Get-ChildItem -Path $path -ErrorAction SilentlyContinue | 
             Where-Object { $_.Name -notmatch "^(node_modules|dist|build|coverage|\.next|\.git|\.nuxt)$" } |
             Select-Object -First 50
    
    $output = ""
    $count = $items.Count
    
    for ($i = 0; $i -lt $count; $i++) {
        $item = $items[$i]
        $isLastItem = ($i -eq $count - 1)
        $connector = if ($isLastItem) { "+--- " } else { "|--- " }
        
        $output += "$prefix$connector$($item.Name)"
        
        if ($item.PSIsContainer) {
            $output += "`n"
            $newPrefix = $prefix + $(if ($isLastItem) { "    " } else { "|   " })
            $output += Get-DirectoryTree -path $item.FullName -prefix $newPrefix -isLast $isLastItem
        } else {
            $output += "`n"
        }
    }
    
    return $output
}

# Inicio do relatorio
$report = @"
# Diagnostico Completo - AB0-1 Project
**Gerado em:** $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")

---

## (Resumo) Resumo Executivo

"@

Write-Host "Analisando projeto..." -ForegroundColor Cyan

# Analise da Raiz
Write-Host "Analisando raiz do projeto..." -ForegroundColor Yellow
$rootFiles = Get-ChildItem -Path $rootPath -File -ErrorAction SilentlyContinue
$report += @"

### Arquivos na Raiz do Projeto
- **Total de arquivos:** $($rootFiles.Count)
- **Arquivos encontrados:** $($rootFiles.Name -join ', ')

"@

# Analise Frontend
Write-Host "Analisando AB0-1-front..." -ForegroundColor Yellow
$frontExists = Test-Path $frontPath

if ($frontExists) {
    $jsStats = Get-CodeStats -path $frontPath -extensions @("*.js", "*.jsx", "*.ts", "*.tsx")
    $cssStats = Get-CodeStats -path $frontPath -extensions @("*.css", "*.scss", "*.sass", "*.less")
    $htmlStats = Get-CodeStats -path $frontPath -extensions @("*.html", "*.vue")
    
    $packageJsonFront = Join-Path $frontPath "package.json"
    $hasPackageJson = Test-Path $packageJsonFront
    
    $report += @"

### Frontend (AB0-1-front)
- **Status:** [OK] Pasta encontrada
- **Arquivos JavaScript/TypeScript:** $($jsStats.Files) arquivos ($($jsStats.Lines) linhas)
- **Arquivos CSS/SCSS:** $($cssStats.Files) arquivos ($($cssStats.Lines) linhas)
- **Arquivos HTML/Vue:** $($htmlStats.Files) arquivos ($($htmlStats.Lines) linhas)
- **Package.json:** $(if ($hasPackageJson) { "[OK] Presente" } else { "[X] Ausente" })

"@

    if ($hasPackageJson) {
        try {
            $packageContent = Get-Content $packageJsonFront -Raw | ConvertFrom-Json
            $report += "**Framework/Biblioteca Principal:** $($packageContent.dependencies.PSObject.Properties.Name -join ', ' | Select-Object -First 5)`n`n"
        } catch {
            $report += "**Aviso:** Erro ao processar package.json`n`n"
        }
    }
} else {
    $report += @"

### Frontend (AB0-1-front)
- **Status:** [ERRO] Pasta nao encontrada

"@
}

# Analise Backend
Write-Host "Analisando AB0-1-back..." -ForegroundColor Yellow
$backExists = Test-Path $backPath

if ($backExists) {
    $pyStats = Get-CodeStats -path $backPath -extensions @("*.py")
    $jsBackStats = Get-CodeStats -path $backPath -extensions @("*.js", "*.ts")
    $rbStats = Get-CodeStats -path $backPath -extensions @("*.rb")
    
    $packageJsonBack = Join-Path $backPath "package.json"
    $requirementsTxt = Join-Path $backPath "requirements.txt"
    $gemfile = Join-Path $backPath "Gemfile"
    
    $hasPackageJsonBack = Test-Path $packageJsonBack
    $hasRequirements = Test-Path $requirementsTxt
    $hasGemfile = Test-Path $gemfile
    
    $report += @"

### Backend (AB0-1-back)
- **Status:** [OK] Pasta encontrada
- **Arquivos Python:** $($pyStats.Files) arquivos ($($pyStats.Lines) linhas)
- **Arquivos JavaScript/TypeScript:** $($jsBackStats.Files) arquivos ($($jsBackStats.Lines) linhas)
- **Arquivos Ruby:** $($rbStats.Files) arquivos ($($rbStats.Lines) linhas)
- **Package.json:** $(if ($hasPackageJsonBack) { "[OK] Presente" } else { "[X] Ausente" })
- **requirements.txt:** $(if ($hasRequirements) { "[OK] Presente" } else { "[X] Ausente" })
- **Gemfile:** $(if ($hasGemfile) { "[OK] Presente" } else { "[X] Ausente" })

"@
} else {
    $report += @"

### Backend (AB0-1-back)
- **Status:** [ERRO] Pasta nao encontrada

"@
}

# Estrutura de diretorios
$report += @"

---

## (Files) Estrutura de Diretorios

### Raiz do Projeto (AB0-1-main)
``````
AB0-1-main/
$(Get-DirectoryTree -path $rootPath)
``````

"@

if ($frontExists) {
    Write-Host "Gerando arvore de diretorios (Frontend)..." -ForegroundColor Yellow
    $report += @"

### Frontend (AB0-1-front)
``````
AB0-1-front/
$(Get-DirectoryTree -path $frontPath)
``````

"@
}

if ($backExists) {
    Write-Host "Gerando arvore de diretorios (Backend)..." -ForegroundColor Yellow
    $report += @"

### Backend (AB0-1-back)
``````
AB0-1-back/
$(Get-DirectoryTree -path $backPath)
``````

"@
}

# Dependencias
$report += @"

---

## [PACK] Dependencias e Configuracoes

"@

# Frontend Dependencies
if ($frontExists -and $hasPackageJson) {
    $report += @"

### Frontend - package.json
``````json
$(Get-Content $packageJsonFront -Raw)
``````

"@
}

# Backend Dependencies
if ($backExists) {
    if ($hasPackageJsonBack) {
        $report += @"

### Backend - package.json
``````json
$(Get-Content $packageJsonBack -Raw)
``````

"@
    }
    
    if ($hasRequirements) {
        $report += @"

### Backend - requirements.txt
``````
$(Get-Content $requirementsTxt -Raw)
``````

"@
    }
    
    if ($hasGemfile) {
        $report += @"

### Backend - Gemfile
``````ruby
$(Get-Content $gemfile -Raw)
``````

"@
    }
}

# Arquivos de configuracao importantes
$report += @"

---

## [CONF] Arquivos de Configuracao

"@

$configFiles = @(
    @{ Path = "$frontPath\.env.example"; Name = "Frontend .env.example" },
    @{ Path = "$frontPath\.env"; Name = "Frontend .env" },
    @{ Path = "$frontPath\vite.config.js"; Name = "Vite Config" },
    @{ Path = "$frontPath\next.config.js"; Name = "Next.js Config" },
    @{ Path = "$frontPath\nuxt.config.js"; Name = "Nuxt Config" },
    @{ Path = "$backPath\.env.example"; Name = "Backend .env.example" },
    @{ Path = "$backPath\.env"; Name = "Backend .env" },
    @{ Path = "$backPath\config.py"; Name = "Python Config" },
    @{ Path = "$backPath\config\database.yml"; Name = "Database Config" }
)

foreach ($config in $configFiles) {
    if (Test-Path $config.Path) {
        $report += "`n### $($config.Name)`n"
        $report += "[OK] **Encontrado:** ``$($config.Path)```n"
    }
}

# Recomendacoes
$report += @"

---

## [INFO] Recomendacoes e Observacoes

"@

$recommendations = @()

if (-not $frontExists) {
    $recommendations += "- [!] **Frontend nao encontrado**: Verificar se a pasta AB0-1-front existe"
}

if (-not $backExists) {
    $recommendations += "- [!] **Backend nao encontrado**: Verificar se a pasta AB0-1-back existe"
}

if ($frontExists -and -not $hasPackageJson) {
    $recommendations += "- [!] **package.json ausente no frontend**: Projeto pode nao estar configurado"
}

if ($backExists -and -not ($hasPackageJsonBack -or $hasRequirements -or $hasGemfile)) {
    $recommendations += "- [!] **Nenhum arquivo de dependencias encontrado no backend**"
}

if ($recommendations.Count -eq 0) {
    $report += "`n[OK] **Estrutura do projeto parece estar correta!**`n"
} else {
    $report += "`n" + ($recommendations -join "`n") + "`n"
}

# Salvar relatorio
$report | Out-File -FilePath $outputFile -Encoding UTF8

Write-Host "`n[OK] Diagnostico concluido!" -ForegroundColor Green
Write-Host "[-] Arquivo gerado: $outputFile" -ForegroundColor Cyan
Write-Host "`nAbrindo arquivo..." -ForegroundColor Yellow

# Abrir o arquivo gerado
Start-Process $outputFile
