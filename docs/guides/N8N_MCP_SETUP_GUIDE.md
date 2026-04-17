# 🚀 n8n MCP Server - Guia de Configuração e Uso

## ✅ Configuração Concluída

Seu MCP do n8n foi configurado com sucesso no Claude Desktop!

### 📍 Localização da Configuração
```
C:\Users\Bobi\AppData\Roaming\Claude\claude_desktop_config.json
```

### 📦 Backup Criado
```
C:\Users\Bobi\AppData\Roaming\Claude\claude_desktop_config_backup_20260310_004759.json
```

---

## 🔧 Configuração Atual

```json
{
  "mcpServers": {
    "posthog": {
      "command": "npx",
      "args": ["-y", "mcp-remote@latest", "https://mcp.posthog.com/sse"]
    },
    "n8n-mcp": {
      "command": "npx",
      "args": [
        "-y",
        "supergateway",
        "--streamableHttp",
        "https://n8n.avaliasolar.com.br/mcp-server/http",
        "--header",
        "authorization:Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
      ]
    }
  }
}
```

---

## 🎯 Próximos Passos

### 1. **Reiniciar Claude Desktop** ⚠️
```
IMPORTANTE: Feche completamente o Claude Desktop e abra novamente
para que a configuração do n8n MCP seja carregada.
```

### 2. **Verificar Conexão**
Após reiniciar, você verá um ícone de "🔌" ou "MCP" na interface do Claude indicando que os servidores MCP estão conectados.

### 3. **Testar Conexão**
Após reiniciar, teste com comandos como:
```
- "Liste os workflows disponíveis no n8n"
- "Busque nodes relacionados a Slack"
- "Crie um workflow de captura de leads"
```

---

## 🛠️ Ferramentas n8n MCP Disponíveis

### 📋 **Node Discovery**
- `search_nodes` - Buscar nodes por palavra-chave
- `get_node` - Obter detalhes de um node específico
- `get_node_operations` - Listar operações de um node

### ✅ **Validation**
- `validate_node` - Validar configuração de node
- `validate_workflow` - Validar workflow completo

### 🔄 **Workflow Management**
- `n8n_create_workflow` - Criar novo workflow
- `n8n_update_partial_workflow` - Atualizar workflow existente
- `n8n_list_workflows` - Listar todos workflows
- `n8n_get_workflow` - Obter detalhes de workflow
- `n8n_activate_workflow` - Ativar workflow
- `n8n_deactivate_workflow` - Desativar workflow

### 📚 **Templates**
- `search_templates` - Buscar templates prontos (2,700+)
- `get_template` - Obter detalhes de template
- `n8n_deploy_template` - Deploy direto de template

### 📖 **Documentation**
- `tools_documentation` - Documentação das ferramentas
- `ai_agents_guide` - Guia para AI agents

---

## 💡 Exemplos de Uso

### Exemplo 1: Buscar Node do Slack
```
"Busque informações sobre o node do Slack no n8n"
```

O Claude usará:
```javascript
search_nodes({query: "slack"})
get_node({nodeType: "nodes-base.slack"})
```

### Exemplo 2: Criar Workflow de Lead Capture
```
"Crie um workflow no n8n que:
1. Receba leads via webhook
2. Envie notificação no Slack
3. Salve no Google Sheets"
```

O Claude usará:
```javascript
n8n_create_workflow({
  name: "Lead Capture Workflow",
  nodes: [...],
  connections: {...}
})
```

### Exemplo 3: Validar Configuração
```
"Valide esta configuração do node Slack:
{
  resource: 'message',
  operation: 'post',
  channel: '#vendas'
}"
```

O Claude usará:
```javascript
validate_node({
  nodeType: "nodes-base.slack",
  config: {...},
  profile: "runtime"
})
```

---

## 🔍 Como Verificar se Está Funcionando

### Método 1: Verificar Interface
Após reiniciar o Claude Desktop, procure por:
- Ícone de "🔌 MCP" ou "Tools" na interface
- Menu de ferramentas disponíveis
- Status de conexão dos servidores

### Método 2: Teste Direto
Pergunte ao Claude:
```
"Quais ferramentas do n8n MCP você tem disponíveis?"
```

### Método 3: Comando de Health Check
```
"Execute um health check do servidor n8n MCP"
```

---

## 🚨 Troubleshooting

### Problema: MCP não aparece após reiniciar

**Solução 1: Verificar logs**
```powershell
# Ver logs do Claude Desktop
Get-Content "$env:APPDATA\Claude\logs\mcp*.log" -Tail 50
```

**Solução 2: Testar comando manualmente**
```powershell
npx -y supergateway --streamableHttp https://n8n.avaliasolar.com.br/mcp-server/http --header "authorization:Bearer eyJ..."
```

**Solução 3: Reinstalar supergateway**
```powershell
npm cache clean --force
npx -y supergateway@latest
```

### Problema: Erro de autenticação

**Verificar:**
1. Token JWT está correto e não expirado
2. URL do servidor está acessível: `https://n8n.avaliasolar.com.br`
3. Endpoint MCP está ativo: `/mcp-server/http`

**Renovar token:**
Acesse sua instância n8n e gere um novo token de API em:
```
Settings → API → Create API Key
```

### Problema: Timeout na conexão

**Verificar:**
1. Firewall não está bloqueando npx/Node.js
2. Proxy configurado corretamente (se aplicável)
3. Internet está estável

---

## 📊 Workflows Prontos para Criar

Com o n8n MCP configurado, você pode criar:

1. **WF-001: Lead Capture Multi-Canal**
   - Webhook + Slack + CRM
   
2. **WF-002: Lead Scoring Automático**
   - CRM Query + Code (Python) + Slack Alert
   
3. **WF-007: Slack Bot de Vendas**
   - Slash Commands + CRM Integration
   
4. **WF-008: Daily Sales Digest**
   - Schedule + APIs + Slack Report

Consulte: `N8N_SALES_WORKFLOWS_COMPREHENSIVE.md`

---

## 🔐 Segurança

### ✅ Boas Práticas Implementadas:
- Token JWT com escopo limitado
- Comunicação via HTTPS
- Autenticação em cada requisição

### ⚠️ Atenções:
- **Não compartilhe** o token JWT publicamente
- **Não commite** o config file no Git
- **Renove** o token periodicamente (ex: a cada 90 dias)

### Rotação de Token:
```bash
# Quando renovar token:
1. Acesse n8n → Settings → API
2. Revogue token antigo
3. Crie novo token
4. Atualize claude_desktop_config.json
5. Reinicie Claude Desktop
```

---

## 📚 Recursos Adicionais

### Documentação n8n MCP:
- GitHub: https://github.com/n8n-io/mcp
- Docs: https://docs.n8n.io/api/mcp/

### Skills Disponíveis:
```
C:\Users\Bobi\Desktop\AB0-1-main\.codex\skills\
├── n8n-code-javascript
├── n8n-code-python
├── n8n-expression-syntax
├── n8n-mcp-tools-expert
├── n8n-node-configuration
└── n8n-validation-expert
```

### Comunidade:
- n8n Community: https://community.n8n.io
- Discord: https://discord.gg/n8n
- Forum: https://community.n8n.io

---

## ✨ Comandos Úteis

### Verificar Status MCP:
```powershell
Get-Process | Where-Object {$_.ProcessName -like "*node*" -or $_.ProcessName -like "*npx*"}
```

### Ver Config Atual:
```powershell
Get-Content "$env:APPDATA\Claude\claude_desktop_config.json" | ConvertFrom-Json | ConvertTo-Json -Depth 10
```

### Restaurar Backup:
```powershell
Copy-Item "C:\Users\Bobi\AppData\Roaming\Claude\claude_desktop_config_backup_*.json" "$env:APPDATA\Claude\claude_desktop_config.json"
```

### Limpar Cache NPX:
```powershell
npm cache clean --force
Remove-Item "$env:LOCALAPPDATA\npm-cache" -Recurse -Force
```

---

## 🎉 Pronto para Usar!

Seu n8n MCP está configurado e pronto para criar automações de vendas poderosas!

**Próximos passos sugeridos:**

1. ✅ Reiniciar Claude Desktop
2. 🧪 Testar conexão com "Liste workflows disponíveis"
3. 📖 Ler `N8N_SALES_WORKFLOWS_COMPREHENSIVE.md`
4. 🚀 Criar seu primeiro workflow de vendas via Slack

---

**Configuração realizada em:** 2026-03-10 00:47:59 UTC  
**Servidor n8n:** https://n8n.avaliasolar.com.br  
**Status:** ✅ Ativo e Pronto
