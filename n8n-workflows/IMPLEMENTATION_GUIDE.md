# 🚀 Implementação dos 17 Workflows de Vendas n8n

## Status de Criação

### ✅ Workflows Criados (JSON)
1. **WF-001**: Captura de Leads Multi-Canal ✅
2. **WF-002**: Lead Scoring Automático ✅
3. **WF-003**: Lead Enrichment Automático ✅
4. **WF-004**: Follow-Up Automático Inteligente ✅
5. **WF-008**: Daily Sales Digest no Slack ✅
6. **WF-017**: Growth Command Center Solar + EV (Webhook + Slack) ✅

#### WF-017: Growth Command Center Solar + EV
**Trigger**: Webhook brief ou payload manual
**Nodes**: Webhook → Parse Brief → Build Content Pack → Slack/Sheets → LinkedIn/X opcional
**Descrição**: Gera pacotes de campanha para solar e EV, salva no sheet e envia drafts para revisão interna via Slack.

### 📋 Workflows Restantes (Estrutura Simplificada)

#### WF-005: Pipeline de Vendas - Notificações de Mudança
**Trigger**: Webhook (CRM)
**Nodes**: Webhook → Code (stage routing) → Slack (contextual message)
**Descrição**: Notifica no Slack quando deals mudam de estágio

#### WF-006: Alerta de Deals Parados
**Trigger**: Schedule (diário 9h)
**Nodes**: Schedule → CRM Query → Code (calculate stalled days) → Filter → Slack Alert
**Descrição**: Identifica oportunidades sem atividade há 5+ dias

#### WF-007: Slack Bot de Vendas - Comandos Interativos
**Trigger**: Slack Slash Commands
**Nodes**: Slack Command → Switch (by command) → HTTP Request (CRM) → Code → Slack Response
**Comandos**: /lead-status, /add-note, /pipeline-summary, /top-deals
**Descrição**: Bot interativo para controlar CRM via Slack

#### WF-009: Slack Approval Workflow
**Trigger**: Webhook (approval request)
**Nodes**: Webhook → Code (prepare message) → Slack (interactive buttons) → Wait → Switch → Update CRM
**Descrição**: Aprovar descontos via Slack com botões interativos

#### WF-010: Weekly Sales Report Automático
**Trigger**: Schedule (segunda-feira 8h)
**Nodes**: Schedule → Multiple HTTP Requests → Code (Python analytics) → Chart API → Slack
**Descrição**: Relatório semanal completo com análise estatística

#### WF-011: Real-Time Sales Dashboard via Slack
**Trigger**: Schedule (a cada 2 horas)
**Nodes**: Schedule → CRM APIs → Code (metrics) → Slack Update Message
**Descrição**: Dashboard atualizado em tempo real em canal fixo

#### WF-012: Lost Deal Analysis & Feedback Loop
**Trigger**: Webhook (deal marked as lost)
**Nodes**: Webhook → Slack Modal (feedback form) → Code (categorize) → Database → Weekly Summary
**Descrição**: Coletar feedback de deals perdidos e gerar insights

#### WF-013: Onboarding Automation
**Trigger**: Webhook (deal won)
**Nodes**: Webhook → Multiple Delays → Email/Slack → Task Creation → CRM Update
**Descrição**: Sequência automática de onboarding (dia 0, 1, 3, 7, 14, 30)

#### WF-014: Churn Prevention - Early Warning System
**Trigger**: Schedule (diário)
**Nodes**: Schedule → Multiple APIs → Code (Python risk scoring) → IF → Slack Alert (CSM)
**Descrição**: Detectar sinais de churn e alertar equipe

#### WF-015: CRM ↔ Slack Bi-Directional Sync
**Trigger**: Multiple (webhook + Slack events)
**Nodes**: Bidirectional sync between CRM and Slack
**Descrição**: Sincronização bidirecional em tempo real

#### WF-016: Multi-Platform Lead Aggregator
**Trigger**: Multiple Webhooks (Facebook, Google, LinkedIn, Website)
**Nodes**: Multiple Webhooks → Merge → Code (normalize schema) → Dedupe → Enrich → CRM → Slack
**Descrição**: Consolidar leads de todas as fontes

---

## 📥 Como Importar os Workflows

### Método 1: Via Interface n8n

1. Acesse: https://n8n.avaliasolar.com.br
2. Clique em **"+ New Workflow"**
3. Menu → **"Import from File"**
4. Selecione o arquivo JSON
5. Configure credenciais (Slack, Google Sheets, etc.)
6. Ative o workflow

### Método 2: Via API (Automático)

```bash
# Importar todos de uma vez
cd n8n-workflows

for file in *.json; do
  curl -X POST https://n8n.avaliasolar.com.br/api/v1/workflows \
    -H "Authorization: Bearer SEU_TOKEN" \
    -H "Content-Type: application/json" \
    -d @"$file"
done
```

### Método 3: Via n8n CLI

```bash
# Se tiver n8n CLI instalado
n8n import:workflow --input=./n8n-workflows/WF-001-lead-capture-multi-canal.json
```

---

## ⚙️ Configurações Necessárias

### 1. Credenciais Slack

```
OAuth Scopes necessários:
- chat:write
- channels:read
- channels:write
- commands
- users:read
- files:write
```

**Criar App no Slack:**
1. https://api.slack.com/apps
2. Create New App → From Scratch
3. Add OAuth Scopes
4. Install to Workspace
5. Copiar OAuth Token (xoxb-...)

### 2. Google Sheets API

1. Google Cloud Console
2. Enable Google Sheets API
3. Create OAuth 2.0 Credentials
4. Adicionar em n8n: Credentials → Google Sheets OAuth2

### 3. Variáveis de Ambiente

```env
# .env no n8n
CLEARBIT_API_KEY=your_key_here
HUNTER_API_KEY=your_key_here
SLACK_BOT_TOKEN=xoxb-your-token
GOOGLE_SHEETS_ID=your-spreadsheet-id
CRM_API_URL=https://your-crm.com/api
CRM_API_KEY=your-crm-key
```

---

## 🎯 Ordem Recomendada de Implementação

### Fase 0: Growth Content (Hoje)
- **WF-017**: Growth Command Center Solar + EV

### Fase 1: Fundação (Semana 1)
1. **WF-001**: Captura de Leads Multi-Canal
2. **WF-002**: Lead Scoring Automático
3. **WF-008**: Daily Sales Digest

### Fase 2: Automação (Semana 2)
4. **WF-004**: Follow-Up Automático
5. **WF-005**: Notificações de Pipeline
6. **WF-006**: Alerta de Deals Parados

### Fase 3: Interatividade (Semana 3)
7. **WF-007**: Slack Bot de Vendas
8. **WF-009**: Approval Workflow
9. **WF-011**: Real-Time Dashboard

### Fase 4: Inteligência (Semana 4)
10. **WF-003**: Lead Enrichment
11. **WF-010**: Weekly Sales Report
12. **WF-012**: Lost Deal Analysis

### Fase 5: Retenção (Semana 5)
13. **WF-013**: Onboarding Automation
14. **WF-014**: Churn Prevention

### Fase 6: Integração (Semana 6)
15. **WF-015**: CRM ↔ Slack Sync
16. **WF-016**: Multi-Platform Aggregator

---

## 🧪 Testes Recomendados

### Para cada workflow:

```bash
# 1. Teste com dados mock
# Criar item de teste no Google Sheets ou enviar via webhook

# 2. Verificar logs no n8n
# Executions → Ver detalhes de cada node

# 3. Verificar Slack
# Mensagem chegou?
# Formato correto?
# Botões funcionando?

# 4. Validar dados salvos
# Google Sheets atualizado?
# CRM sincronizado?
```

---

## 📊 Métricas de Sucesso

### KPIs para acompanhar após 30 dias:

- **Tempo de resposta a leads**: Target < 5 minutos
- **Taxa de conversão**: Target +20%
- **Tarefas manuais eliminadas**: Target 70%
- **Satisfação da equipe**: Target 8/10
- **Deals parados**: Target -50%
- **Follow-ups automatizados**: Target 100%

---

## 🔧 Personalização

### Ajustar para sua realidade:

1. **Canais do Slack**: Substituir #vendas-* pelos seus canais
2. **Google Sheets ID**: Usar seu spreadsheet
3. **CRM**: Adaptar para HubSpot/Pipedrive/Salesforce
4. **Horários**: Ajustar schedules conforme timezone
5. **Mensagens**: Personalizar textos e idioma
6. **Critérios de Score**: Ajustar algoritmo para seu negócio

---

## 📚 Documentação de Referência

### Skills disponíveis em `.codex/skills/`:
- `n8n-code-javascript` - JavaScript em Code nodes
- `n8n-code-python` - Python em Code nodes
- `n8n-expression-syntax` - Expressões n8n
- `n8n-mcp-tools-expert` - Ferramentas MCP
- `n8n-node-configuration` - Configuração de nodes
- `n8n-validation-expert` - Validação e debugging

### Arquivos de referência:
- `N8N_SALES_WORKFLOWS_COMPREHENSIVE.md` - Guia completo
- `N8N_MCP_SETUP_GUIDE.md` - Configuração MCP
- `.codex/n8n-mcp-config.md` - Config do projeto

---

## 🚨 Troubleshooting Comum

### Erro: "Missing credentials"
**Solução**: Configurar credenciais em Settings → Credentials

### Erro: "Webhook not found"
**Solução**: Ativar workflow e copiar URL do webhook

### Erro: "Slack API error"
**Solução**: Verificar OAuth scopes e reinstalar app

### Erro: "Google Sheets unauthorized"
**Solução**: Re-autenticar OAuth2 credentials

### Erro: "Code execution timeout"
**Solução**: Otimizar código ou aumentar timeout

---

## 🎉 Próximos Passos

1. ✅ Importar WF-001 a WF-005, WF-008 e WF-017 (já criados)
2. 📝 Adaptar templates para WF-006 a WF-017
3. 🧪 Testar cada workflow individualmente
4. 🔄 Ajustar baseado em feedback da equipe
5. 📊 Monitorar métricas semanalmente
6. 🚀 Escalar para toda equipe de vendas

---

**Workflows Criados**: 6/17  
**Estruturas Documentadas**: 17/17  
**Status**: Pronto para implementação  
**Tempo estimado setup completo**: 4-6 semanas

Para criar os workflows restantes automaticamente via MCP, execute:
```bash
# Comando para criar todos via n8n MCP
# (requer MCP configurado e ativo)
```
