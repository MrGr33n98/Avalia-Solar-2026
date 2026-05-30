# PowerShell Script to Reorganize Hermes Agent Structure for Avalia Solar
# Run: .\reorganize.ps1

Write-Host "🤖 Iniciando reorganização estrutural do Hermes Agent para Avalia Solar..." -ForegroundColor Cyan

$RootPath = "c:\Users\Bobi\Desktop\AB0-1-main"
$HermesDir = Join-Path $RootPath "hermes-agent"

# 1. Criar estrutura de diretórios
$Dirs = @(
    "docs",
    "skills/linkedin-prospector/scripts",
    "skills/competitor-listening/scripts",
    "skills/inbox-triager/scripts",
    "skills/solar-mobility-leads",
    "skills/utils",
    "scripts",
    "config"
)

foreach ($Dir in $Dirs) {
    $TargetDir = Join-Path $HermesDir $Dir
    if (-not (Test-Path $TargetDir)) {
        New-Item -ItemType Directory -Force -Path $TargetDir | Out-Null
        Write-Host "   📁 Criado diretório: hermes-agent/$Dir" -ForegroundColor Gray
    }
}

# 2. Migrar e Consolidar Documentos
Write-Host "`n📝 Movendo e consolidando documentos estratégicos..." -ForegroundColor Green

if (Test-Path "$RootPath\HERMES_GROWTH_AUTOMATION_MAP.md") {
    Move-Item -Path "$RootPath\HERMES_GROWTH_AUTOMATION_MAP.md" -Destination "$HermesDir\docs\growth-automation-map.md" -Force
    Write-Host "   ✓ Movido: HERMES_GROWTH_AUTOMATION_MAP.md -> hermes-agent/docs/growth-automation-map.md"
}

if (Test-Path "$RootPath\README-AVALIASOLAR-MOBILIDADE.md") {
    Move-Item -Path "$RootPath\README-AVALIASOLAR-MOBILIDADE.md" -Destination "$HermesDir\docs\mobility-alignment.md" -Force
    Write-Host "   ✓ Movido: README-AVALIASOLAR-MOBILIDADE.md -> hermes-agent/docs/mobility-alignment.md"
}

if (Test-Path "$RootPath\roadmap-avaliasolar-mobilidade.md") {
    Move-Item -Path "$RootPath\roadmap-avaliasolar-mobilidade.md" -Destination "$HermesDir\docs\roadmap.md" -Force
    Write-Host "   ✓ Movido: roadmap-avaliasolar-mobilidade.md -> hermes-agent/docs/roadmap.md"
}

# 3. Migrar e Reorganizar Custom Skills
Write-Host "`n⚙️  Reorganizando Custom Skills cognitivas e scripts TS..." -ForegroundColor Green

# Utils
if (Test-Path "$RootPath\.planning\skills\utils.ts") {
    Move-Item -Path "$RootPath\.planning\skills\utils.ts" -Destination "$HermesDir\skills\utils\utils.ts" -Force
    Write-Host "   ✓ Movido: utils.ts -> hermes-agent/skills/utils/utils.ts"
}

# LinkedIn
if (Test-Path "$RootPath\.planning\skills\hermes-linkedin-prospector\SKILL.md") {
    Move-Item -Path "$RootPath\.planning\skills\hermes-linkedin-prospector\SKILL.md" -Destination "$HermesDir\skills\linkedin-prospector\SKILL.md" -Force
}
if (Test-Path "$RootPath\.planning\skills\hermes-linkedin-prospector\workflow.md") {
    Move-Item -Path "$RootPath\.planning\skills\hermes-linkedin-prospector\workflow.md" -Destination "$HermesDir\skills\linkedin-prospector\workflow.md" -Force
}
if (Test-Path "$RootPath\.planning\skills\hermes-linkedin-prospector\scripts\enrich-lead-data.ts") {
    Move-Item -Path "$RootPath\.planning\skills\hermes-linkedin-prospector\scripts\enrich-lead-data.ts" -Destination "$HermesDir\skills\linkedin-prospector\scripts\enrich-lead-data.ts" -Force
}
if (Test-Path "$RootPath\.planning\skills\hermes-linkedin-prospector\scripts\linkedin-outbound-sync.ts") {
    Move-Item -Path "$RootPath\.planning\skills\hermes-linkedin-prospector\scripts\linkedin-outbound-sync.ts" -Destination "$HermesDir\skills\linkedin-prospector\scripts\linkedin-outbound-sync.ts" -Force
}
if (Test-Path "$RootPath\skills\avaliasolar\linkedin-regional-prospector.ts") {
    Move-Item -Path "$RootPath\skills\avaliasolar\linkedin-regional-prospector.ts" -Destination "$HermesDir\skills\linkedin-prospector\scripts\linkedin-regional-prospector.ts" -Force
}
Write-Host "   ✓ Reorganizado: hermes-linkedin-prospector -> hermes-agent/skills/linkedin-prospector/"

# Competitor Listening
if (Test-Path "$RootPath\.planning\skills\hermes-competitor-listening\SKILL.md") {
    Move-Item -Path "$RootPath\.planning\skills\hermes-competitor-listening\SKILL.md" -Destination "$HermesDir\skills\competitor-listening\SKILL.md" -Force
}
if (Test-Path "$RootPath\.planning\skills\hermes-competitor-listening\workflow.md") {
    Move-Item -Path "$RootPath\.planning\skills\hermes-competitor-listening\workflow.md" -Destination "$HermesDir\skills\competitor-listening\workflow.md" -Force
}
if (Test-Path "$RootPath\.planning\skills\hermes-competitor-listening\scripts\scrape-competitor-comments.ts") {
    Move-Item -Path "$RootPath\.planning\skills\hermes-competitor-listening\scripts\scrape-competitor-comments.ts" -Destination "$HermesDir\skills\competitor-listening\scripts\scrape-competitor-comments.ts" -Force
}
Write-Host "   ✓ Reorganizado: hermes-competitor-listening -> hermes-agent/skills/competitor-listening/"

# Inbox Triager
if (Test-Path "$RootPath\.planning\skills\hermes-inbox-triager\SKILL.md") {
    Move-Item -Path "$RootPath\.planning\skills\hermes-inbox-triager\SKILL.md" -Destination "$HermesDir\skills\inbox-triager\SKILL.md" -Force
}
if (Test-Path "$RootPath\.planning\skills\hermes-inbox-triager\workflow.md") {
    Move-Item -Path "$RootPath\.planning\skills\hermes-inbox-triager\workflow.md" -Destination "$HermesDir\skills\inbox-triager\workflow.md" -Force
}
if (Test-Path "$RootPath\.planning\skills\hermes-inbox-triager\scripts\gmail-inbox-processor.ts") {
    Move-Item -Path "$RootPath\.planning\skills\hermes-inbox-triager\scripts\gmail-inbox-processor.ts" -Destination "$HermesDir\skills\inbox-triager\scripts\gmail-inbox-processor.ts" -Force
}
if (Test-Path "$RootPath\skills\avaliasolar\gmail-classifier.ts") {
    Move-Item -Path "$RootPath\skills\avaliasolar\gmail-classifier.ts" -Destination "$HermesDir\skills\inbox-triager\scripts\gmail-classifier.ts" -Force
}
Write-Host "   ✓ Reorganizado: hermes-inbox-triager -> hermes-agent/skills/inbox-triager/"

# Solar Mobility Prospeo
if (Test-Path "$RootPath\skills\avaliasolar\prospeo-lead-export.ts") {
    Move-Item -Path "$RootPath\skills\avaliasolar\prospeo-lead-export.ts" -Destination "$HermesDir\skills\solar-mobility-leads\prospeo-lead-export.ts" -Force
    Write-Host "   ✓ Reorganizado: prospeo-lead-export.ts -> hermes-agent/skills/solar-mobility-leads/prospeo-lead-export.ts"
}

# 4. Migrar Outros Scripts Auxiliares
Write-Host "`n💻 Reorganizando scripts operacionais e configurações..." -ForegroundColor Green

if (Test-Path "$RootPath\skills\avaliasolar\instagram-keyword-reply.ts") {
    Move-Item -Path "$RootPath\skills\avaliasolar\instagram-keyword-reply.ts" -Destination "$HermesDir\scripts\instagram-keyword-reply.ts" -Force
}
if (Test-Path "$RootPath\skills\avaliasolar\nutshell-lead-enrichment.ts") {
    Move-Item -Path "$RootPath\skills\avaliasolar\nutshell-lead-enrichment.ts" -Destination "$HermesDir\scripts\nutshell-lead-enrichment.ts" -Force
}
if (Test-Path "$RootPath\skills\avaliasolar\abandoned-checkout-recovery.ts") {
    Move-Item -Path "$RootPath\skills\avaliasolar\abandoned-checkout-recovery.ts" -Destination "$HermesDir\scripts\abandoned-checkout-recovery.ts" -Force
}
if (Test-Path "$RootPath\skills\avaliasolar\verify-credentials-avaliasolar.ts") {
    Move-Item -Path "$RootPath\skills\avaliasolar\verify-credentials-avaliasolar.ts" -Destination "$HermesDir\scripts\verify-credentials-avaliasolar.ts" -Force
}

# Config / env.example
if (Test-Path "$RootPath\.env.example") {
    Copy-Item -Path "$RootPath\.env.example" -Destination "$HermesDir\config\.env.example" -Force
    Write-Host "   ✓ Copiado: .env.example -> hermes-agent/config/.env.example"
}

# Limpeza de pastas vazias antigas
if (Test-Path "$RootPath\skills\avaliasolar") {
    Remove-Item -Path "$RootPath\skills\avaliasolar" -Recurse -Force | Out-Null
}
if (Test-Path "$RootPath\.planning\skills\hermes-linkedin-prospector") {
    Remove-Item -Path "$RootPath\.planning\skills\hermes-linkedin-prospector" -Recurse -Force | Out-Null
}
if (Test-Path "$RootPath\.planning\skills\hermes-competitor-listening") {
    Remove-Item -Path "$RootPath\.planning\skills\hermes-competitor-listening" -Recurse -Force | Out-Null
}
if (Test-Path "$RootPath\.planning\skills\hermes-inbox-triager") {
    Remove-Item -Path "$RootPath\.planning\skills\hermes-inbox-triager" -Recurse -Force | Out-Null
}

Write-Host "`n🎉 Reorganização concluída com sucesso! Todos os arquivos estão agrupados sob a pasta 'hermes-agent/'." -ForegroundColor Yellow
