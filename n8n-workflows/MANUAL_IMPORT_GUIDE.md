# 🚀 Guia de Import Manual dos Workflows n8n

## ⚠️ Problema Identificado

A tentativa de import automático via API retornou erro **401 Unauthorized**. Isso pode acontecer por:

1. **Token JWT expirado** - O token MCP pode ter expirado
2. **Endpoint diferente** - A API pode usar outro endpoint
3. **Autenticação diferente** - Pode requerer outro tipo de auth

---

## ✅ Solução 1: Import Manual via Interface (RECOMENDADO)

### Passo a Passo:

1. **Acesse o n8n:**
   ```
   https://n8n.avaliasolar.com.br
   ```

2. **Para cada workflow:**
   
   a. Clique em **"+ New Workflow"** (canto superior direito)
   
   b. Clique no menu **⋮** (três pontos) → **"Import from File"**
   
   c. Selecione o arquivo JSON do workflow:
   ```
   C:\Users\Bobi\Desktop\AB0-1-main\n8n-workflows\WF-XXX-nome.json
   ```
   
   d. O workflow será carregado com todos os nodes
   
   e. **Configure as credenciais necessárias:**
      - Slack OAuth2
      - Google Sheets OAuth2
      - APIs externas (se houver)
   
   f. **Teste o workflow:**
      - Clique em "Execute Workflow" (para workflows manuais)
      - Ou envie dados de teste para o webhook
   
   g. **Ative o workflow:**
      - Toggle "Active" no canto superior direito

3. **Repita para os 8 workflows:**
   - ✅ WF-001-lead-capture-multi-canal.json
   - ✅ WF-002-lead-scoring-automatico.json
   - ✅ WF-003-lead-enrichment.json
   - ✅ WF-004-followup-automatico.json
   - ✅ WF-006-deals-parados.json
   - ✅ WF-008-daily-sales-digest.json
   - ✅ WF-011-realtime-dashboard.json
   - ✅ WF-014-churn-prevention.json

---

## ✅ Solução 2: Renovar Token e Tentar Novamente

### 1. Gerar Novo Token API no n8n:

1. Acesse: `https://n8n.avaliasolar.com.br`
2. Vá em: **Settings → API Keys**
3. Clique em **"Create API Key"**
4. Copie o token gerado

### 2. Atualizar os Scripts:

**Atualizar MCP config (`.codex/mcp.json`):**
```json
{
  "mcpServers": {
    "n8n-mcp": {
      "command": "npx",
      "args": [
        "-y",
        "supergateway",
        "--streamableHttp",
        "https://n8n.avaliasolar.com.br/mcp-server/http",
        "--header",
        "authorization:Bearer SEU_NOVO_TOKEN_AQUI"
      ]
    }
  }
}
```

**Atualizar script PowerShell (`import-workflows.ps1`):**
```powershell
$N8N_API_TOKEN = "SEU_NOVO_TOKEN_AQUI"
```

### 3. Executar novamente:
```powershell
cd C:\Users\Bobi\Desktop\AB0-1-main\n8n-workflows
.\import-workflows.ps1
```

---

## ✅ Solução 3: Import via cURL (Terminal)

Se preferir linha de comando:

```bash
# Para cada workflow
curl -X POST https://n8n.avaliasolar.com.br/api/v1/workflows \
  -H "X-N8N-API-KEY: SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d @WF-001-lead-capture-multi-canal.json
```

---

## 📋 Checklist de Import

Após importar cada workflow, verificar:

### WF-001: Captura de Leads Multi-Canal
- [ ] Webhook URL copiada
- [ ] Credencial Slack configurada
- [ ] Credencial Google Sheets configurada
- [ ] Google Sheets ID atualizado no node
- [ ] Testado com POST de exemplo
- [ ] Workflow ativado

### WF-002: Lead Scoring Automático
- [ ] Schedule configurado (a cada 6 horas)
- [ ] Credencial Google Sheets configurada
- [ ] Google Sheets ID atualizado
- [ ] Credencial Slack configurada
- [ ] Canal #vendas-hot-leads existe
- [ ] Testado manualmente
- [ ] Workflow ativado

### WF-003: Lead Enrichment Automático
- [ ] Schedule configurado (diário 2h)
- [ ] Credencial Google Sheets configurada
- [ ] APIs de enrichment configuradas (se houver)
- [ ] Credencial Slack configurada
- [ ] Canal #vendas-enrichment existe
- [ ] Testado manualmente
- [ ] Workflow ativado

### WF-004: Follow-Up Automático
- [ ] Schedule configurado (diário 9h)
- [ ] Fonte de dados CRM configurada
- [ ] Credencial Slack configurada
- [ ] Canal #vendas-followups existe
- [ ] Lógica de follow-up ajustada
- [ ] Testado manualmente
- [ ] Workflow ativado

### WF-006: Alerta de Deals Parados
- [ ] Schedule configurado (dias úteis 9h)
- [ ] Fonte de dados CRM configurada
- [ ] Credencial Slack configurada
- [ ] Slack IDs dos owners mapeados
- [ ] Testado manualmente
- [ ] Workflow ativado

### WF-008: Daily Sales Digest
- [ ] Schedule configurado (diário 9h)
- [ ] APIs CRM/Analytics configuradas
- [ ] Credencial Slack configurada
- [ ] Canal #vendas-daily existe
- [ ] Métricas ajustadas para sua realidade
- [ ] Testado manualmente
- [ ] Workflow ativado

### WF-011: Real-Time Dashboard
- [ ] Schedule configurado (a cada 2 horas)
- [ ] APIs CRM configuradas
- [ ] Credencial Slack configurada
- [ ] Canal #vendas-dashboard existe
- [ ] **Primeira execução**: usar operation='post'
- [ ] **Copiar message_id** da mensagem criada
- [ ] **Adicionar env var**: DASHBOARD_MESSAGE_ID
- [ ] **Segunda execução em diante**: usar operation='update'
- [ ] Testado manualmente
- [ ] Workflow ativado

### WF-014: Churn Prevention System
- [ ] Schedule configurado (diário 8h)
- [ ] APIs Product Analytics configuradas
- [ ] APIs Support configuradas
- [ ] Credencial Slack configurada
- [ ] Slack IDs dos CSMs mapeados
- [ ] Algoritmo de risco ajustado
- [ ] Testado manualmente
- [ ] Workflow ativado

---

## 🔧 Configurações Comuns

### Credenciais Slack (todos workflows)

1. Ir em: `Credentials → Add Credential → Slack OAuth2 API`
2. Criar Slack App em: https://api.slack.com/apps
3. OAuth Scopes necessários:
   ```
   - chat:write
   - channels:read
   - channels:write
   - files:write
   - users:read
   ```
4. Install to Workspace
5. Copiar OAuth Token (xoxb-...)
6. Adicionar em n8n Credentials

### Credenciais Google Sheets (WF-001, WF-002, WF-003)

1. Ir em: `Credentials → Add Credential → Google Sheets OAuth2 API`
2. Seguir fluxo OAuth do Google
3. Permitir acesso ao Google Sheets

### Google Sheets ID

Em cada node Google Sheets, substituir:
```
"your-spreadsheet-id"
```

Por:
```
"1ABC123XYZ..." (seu ID real)
```

O ID está na URL do Google Sheets:
```
https://docs.google.com/spreadsheets/d/[SEU_ID_AQUI]/edit
```

---

## 📊 Canais Slack Necessários

Criar os seguintes canais no Slack antes de ativar:

```
#vendas-leads          - Notificações de novos leads
#vendas-hot-leads      - Alertas de leads quentes (score > 70)
#vendas-enrichment     - Relatórios de enrichment
#vendas-followups      - Follow-ups agendados
#vendas-daily          - Digest diário
#vendas-dashboard      - Dashboard em tempo real
```

---

## 🧪 Testando os Workflows

### Teste WF-001 (Webhook):
```bash
curl -X POST https://n8n.avaliasolar.com.br/webhook/lead-capture \
  -H "Content-Type: application/json" \
  -d '{
    "name": "João Silva",
    "email": "joao@empresa.com",
    "phone": "+5511999999999",
    "company": "Empresa Teste",
    "source": "website",
    "product": "Produto A"
  }'
```

### Teste WF-002, 003, 004, 006, 008, 014 (Schedule):
- Clicar em "Execute Workflow" no n8n
- Verificar logs de execução
- Confirmar mensagens no Slack

### Teste WF-011 (Dashboard):
1. Primeira execução: criar mensagem no Slack
2. Copiar message_id da resposta
3. Adicionar env var: `DASHBOARD_MESSAGE_ID=1234567890.123456`
4. Próximas execuções: atualizar mensagem existente

---

## ❓ Troubleshooting

### Erro: "Missing credentials"
**Solução**: Configurar credenciais em Settings → Credentials

### Erro: "Webhook not found"
**Solução**: Ativar workflow e copiar a URL completa do webhook

### Erro: "Slack channel not found"
**Solução**: Criar canal no Slack ou corrigir nome do canal

### Erro: "Google Sheets unauthorized"
**Solução**: Re-autenticar OAuth2 em Credentials

### Erro: "Code execution timeout"
**Solução**: Otimizar código ou aumentar timeout em workflow settings

---

## 🎯 Ordem de Import Recomendada

1. **WF-001** - Base de captura de leads
2. **WF-008** - Dashboard diário (visibilidade rápida)
3. **WF-002** - Lead scoring (priorização)
4. **WF-004** - Follow-ups (automação imediata)
5. **WF-006** - Deals parados (recuperação)
6. **WF-011** - Dashboard real-time (monitoramento)
7. **WF-003** - Enrichment (dados adicionais)
8. **WF-014** - Churn prevention (retenção)

---

## ✅ Checklist Final

Após importar todos workflows:

- [ ] Todos workflows importados (8/8)
- [ ] Todas credenciais configuradas
- [ ] Todos canais Slack criados
- [ ] Google Sheets configurado
- [ ] Webhooks testados
- [ ] Schedules verificados
- [ ] Todos workflows ativos
- [ ] Equipe treinada
- [ ] Documentação compartilhada

---

**Tempo estimado de setup completo**: 2-3 horas

**Dificuldade**: Média

**Suporte**: Consultar documentação em `N8N_SALES_WORKFLOWS_COMPREHENSIVE.md`
