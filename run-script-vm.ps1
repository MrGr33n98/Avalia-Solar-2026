<#
.SYNOPSIS
Script para transferir e executar o fix-s3-credentials.sh na VM DigitalOcean
#>

# Configurações básicas
$VM_IP = "64.225.59.107"
$VM_USER     = "root"
$PROJECT_DIR = "/root/Avalia-Solar-2026"
$LOCAL_SCRIPT = ".\fix-s3-credentials.sh"
$VM_SCRIPT    = "$PROJECT_DIR/fix-s3-credentials.sh"

Write-Host "==========================================" -ForegroundColor Yellow
Write-Host "   EXECUCAO DE SCRIPT NA VM DIGITALOCEAN" -ForegroundColor Yellow
Write-Host "==========================================" -ForegroundColor Yellow
Write-Host ""

# Verificar se o script local existe
if (-not (Test-Path $LOCAL_SCRIPT)) {
  Write-Host "❌ ERRO: Arquivo $LOCAL_SCRIPT nao encontrado!" -ForegroundColor Red
  exit 1
}

Write-Host "📋 PASSO 1: Testar conexao SSH com a VM" -ForegroundColor Cyan
Write-Host "------------------------------------------"

try {
  Write-Host "Testando conexao com ${VM_USER}@${VM_IP}..." -ForegroundColor Yellow
  ssh -o ConnectTimeout=10 ("{0}@{1}" -f $VM_USER, $VM_IP) "echo 'Conexao SSH bem-sucedida!'"
  if ($LASTEXITCODE -ne 0) { throw "Falha na conexao SSH (exitcode $LASTEXITCODE)." }
  Write-Host "✅ Conexao SSH bem-sucedida!" -ForegroundColor Green
} catch {
  Write-Host "❌ Erro na conexao SSH: $_" -ForegroundColor Red
  exit 1
}

Write-Host ""
Write-Host "📋 PASSO 2: Transferir script para a VM" -ForegroundColor Cyan
Write-Host "------------------------------------------"

try {
  $remote = "{0}@{1}:{2}" -f $VM_USER, $VM_IP, $VM_SCRIPT
  Write-Host ("Transferindo {0} para {1}..." -f $LOCAL_SCRIPT, $remote) -ForegroundColor Yellow

  scp $LOCAL_SCRIPT "$VM_USER@$VM_IP`:$VM_SCRIPT"
  if ($LASTEXITCODE -ne 0) { throw "Falha no SCP (exitcode $LASTEXITCODE)." }

  Write-Host "✅ Arquivo transferido com sucesso!" -ForegroundColor Green
} catch {
  Write-Host "❌ Erro na transferencia SCP: $_" -ForegroundColor Red
  exit 1
}

Write-Host ""
Write-Host "📋 PASSO 3: Dar permissao de execucao" -ForegroundColor Cyan
Write-Host "------------------------------------------"

try {
  Write-Host "Concedendo permissoes de execucao..." -ForegroundColor Yellow
  ssh ("{0}@{1}" -f $VM_USER, $VM_IP) ("chmod +x {0}" -f $VM_SCRIPT)
  if ($LASTEXITCODE -ne 0) { throw "Falha ao chmod (exitcode $LASTEXITCODE)." }

  Write-Host "✅ Permissoes concedidas com sucesso!" -ForegroundColor Green
} catch {
  Write-Host "❌ Erro ao conceder permissoes: $_" -ForegroundColor Red
  exit 1
}

Write-Host ""
Write-Host "📋 PASSO 4: Executar script na VM" -ForegroundColor Cyan
Write-Host "------------------------------------------"

try {
  Write-Host "Executando script na VM..." -ForegroundColor Yellow
  Write-Host "💡 O script solicitara:"
  Write-Host "   - SPACES_ACCESS_KEY_ID"
  Write-Host "   - SPACES_SECRET_ACCESS_KEY"
  Write-Host "   - Nome do bucket (use 'avalia-backups' se nao souber)"
  Write-Host "   - Regiao (use 'nyc3' se nao souber)"
  Write-Host ""
  Write-Host "🔴 Pressione Enter para continuar..."
  Read-Host | Out-Null

  # Sem '&&' (compatível com PS 5.1): encadeia no bash -lc
  $cmd = "cd $PROJECT_DIR; ./fix-s3-credentials.sh"
  ssh -t ("{0}@{1}" -f $VM_USER, $VM_IP) ("bash -lc " + ('"{0}"' -f $cmd))

  if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Script executado com sucesso!" -ForegroundColor Green
  } else {
    Write-Host "❌ Erro na execucao do script (exitcode $LASTEXITCODE)." -ForegroundColor Red
  }
} catch {
  Write-Host "❌ Erro na execucao do script: $_" -ForegroundColor Red
  exit 1
}

Write-Host ""
Write-Host "📋 PASSO 5: Verificar status dos containers" -ForegroundColor Cyan
Write-Host "------------------------------------------"

try {
  Write-Host "Verificando status dos containers..." -ForegroundColor Yellow
  $cmd = "cd $PROJECT_DIR; docker compose ps 2>/dev/null || docker-compose ps"
  ssh ("{0}@{1}" -f $VM_USER, $VM_IP) ("bash -lc " + ('"{0}"' -f $cmd))
} catch {
  Write-Host "❌ Erro ao verificar containers: $_" -ForegroundColor Red
}

Write-Host ""
Write-Host "📋 PASSO 6: Verificar logs do backend" -ForegroundColor Cyan
Write-Host "------------------------------------------"

try {
  Write-Host "Visualizando logs do backend (ultimas 20 linhas)..." -ForegroundColor Yellow
  $cmd = "cd $PROJECT_DIR; (docker compose logs --tail=20 backend 2>/dev/null || docker-compose logs --tail=20 backend) | grep -Ei 'storage|s3|spaces|error' || echo 'Nenhum erro encontrado'"
  ssh ("{0}@{1}" -f $VM_USER, $VM_IP) ("bash -lc " + ('"{0}"' -f $cmd))
} catch {
  Write-Host "❌ Erro ao verificar logs: $_" -ForegroundColor Red
}

Write-Host ""
Write-Host "==========================================" -ForegroundColor Yellow
Write-Host "   PROCESSO CONCLUIDO!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Yellow
Write-Host ""
Write-Host "📝 PROXIMOS PASSOS:"
Write-Host "1. Testar upload no admin: https://api.avaliasolar.com.br/admin"
Write-Host "2. Monitorar logs em tempo real:"
Write-Host ("   ssh {0}@{1} 'cd {2}; docker compose logs -f backend || docker-compose logs -f backend'" -f $VM_USER, $VM_IP, $PROJECT_DIR)
Write-Host ""
Write-Host "💡 Se houver problemas, verifique:" -ForegroundColor Yellow
Write-Host "   - Credenciais corretas no DigitalOcean Spaces"
Write-Host "   - Bucket 'avalia-backups' existe na regiao 'nyc3'"
Write-Host "   - CORS esta configurado no bucket"
Write-Host "   - Firewall da DigitalOcean permite acesso"
Write-Host ""
