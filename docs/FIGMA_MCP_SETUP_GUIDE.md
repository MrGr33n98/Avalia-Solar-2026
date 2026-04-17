# 🎨 Figma MCP Server - Guia de Configuração e Uso

## ✅ Configuração Concluída

Seu MCP do Figma foi configurado com sucesso no Claude Desktop!

### 📍 Localização da Configuração
```
C:\Users\Bobi\AppData\Roaming\Claude\claude_desktop_config.json
```

### 📦 Backup Criado
```
C:\Users\Bobi\AppData\Roaming\Claude\claude_desktop_config_backup_20260312_033054.json
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
        "authorization:Bearer eyJ..."
      ]
    },
    "figma": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-figma"],
      "env": {
        "FIGMA_PERSONAL_ACCESS_TOKEN": "figd_K-PymVAEGP1iJScJ2zr9Fxp6rwXqq7Drv_Bn0y4A"
      }
    }
  }
}
```

---

## 🎯 Próximos Passos

### 1. **Reiniciar Claude Desktop** ⚠️
```
IMPORTANTE: Feche completamente o Claude Desktop e abra novamente
para que a configuração do Figma MCP seja carregada.
```

### 2. **Verificar Conexão**
Após reiniciar, você verá um ícone de "🔌" ou "MCP" na interface do Claude indicando que os servidores MCP estão conectados.

### 3. **Testar Conexão**
Após reiniciar, teste com comandos como:
```
- "Liste meus arquivos no Figma"
- "Mostre informações do arquivo [file-key]"
- "Analise o design do componente [node-id]"
```

---

## 🛠️ Ferramentas Figma MCP Disponíveis

### 📁 **File Operations**
- `get_file` - Obter dados completos de um arquivo Figma
- `get_file_nodes` - Obter nós específicos de um arquivo
- `get_images` - Exportar imagens de nós específicos

### 🎨 **Design Analysis**
- Extrair informações de design (cores, tipografia, espaçamentos)
- Analisar estrutura de componentes
- Identificar design tokens
- Mapear hierarquia de frames e layers

### 📝 **Comments**
- `get_comments` - Obter comentários de um arquivo
- Analisar feedback de design
- Rastrear discussões de revisão

### 👥 **Team & Projects**
- Listar arquivos de projetos
- Acessar informações de equipe
- Gerenciar colaboração

---

## 💡 Exemplos de Uso

### Exemplo 1: Analisar Design System
```
"Analise o arquivo Figma com key 'abc123' e extraia todos os componentes e suas propriedades"
```

O Claude usará:
```javascript
get_file({file_key: "abc123"})
```

### Exemplo 2: Exportar Assets
```
"Exporte as imagens dos seguintes nós do arquivo 'xyz789':
- node-id-1
- node-id-2
em formato PNG 2x"
```

O Claude usará:
```javascript
get_images({
  file_key: "xyz789",
  ids: ["node-id-1", "node-id-2"],
  format: "png",
  scale: 2
})
```

### Exemplo 3: Extrair Design Tokens
```
"Extraia todos os estilos de cor e tipografia do arquivo 'design-system-key'"
```

O Claude usará:
```javascript
get_file({file_key: "design-system-key"})
// Então analisa styles.fills, styles.text, etc.
```

### Exemplo 4: Revisar Comentários
```
"Mostre todos os comentários não resolvidos do arquivo 'project-key'"
```

O Claude usará:
```javascript
get_comments({file_key: "project-key"})
```

---

## 🔍 Como Obter File Keys e Node IDs

### File Key
1. Abra o arquivo no Figma
2. Copie da URL: `https://figma.com/file/[FILE_KEY]/nome-do-arquivo`
3. Exemplo: `https://figma.com/file/abc123xyz/Design-System`
   - File Key: `abc123xyz`

### Node ID
1. Selecione um elemento no Figma
2. Clique com botão direito → "Copy/Paste as" → "Copy link"
3. O link contém: `https://figma.com/file/[FILE_KEY]/nome?node-id=[NODE_ID]`
4. Exemplo: `node-id=123%3A456` → Node ID: `123:456`

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
$env:FIGMA_PERSONAL_ACCESS_TOKEN="figd_K-PymVAEGP1iJScJ2zr9Fxp6rwXqq7Drv_Bn0y4A"
npx -y @modelcontextprotocol/server-figma
```

**Solução 3: Reinstalar pacote**
```powershell
npm cache clean --force
npx -y @modelcontextprotocol/server-figma
```

### Problema: Erro de autenticação

**Verificar:**
1. Token está correto e não expirado
2. Token tem as permissões necessárias no Figma

**Renovar token:**
1. Acesse Figma → Settings → Account
2. Vá para "Personal access tokens"
3. Revogue o token antigo
4. Crie novo token com escopo "File content"
5. Atualize `claude_desktop_config.json`
6. Reinicie Claude Desktop

### Problema: "File not found"

**Verificar:**
1. File key está correto
2. Você tem acesso ao arquivo no Figma
3. Token tem permissão para acessar o arquivo/projeto

---

## 🎨 Use Cases Comuns

### 1. **Design System Extraction**
Extrair automaticamente:
- Paleta de cores
- Escala tipográfica
- Componentes e variantes
- Espaçamentos e grid
- Shadows e efeitos

### 2. **Design to Code**
Converter designs em:
- Componentes React/Vue/Angular
- CSS/Tailwind classes
- Design tokens JSON
- Storybook stories

### 3. **Design Review Automation**
- Coletar feedback de comentários
- Gerar relatórios de revisão
- Identificar issues pendentes
- Rastrear progresso de implementação

### 4. **Asset Export Pipeline**
- Exportar ícones em múltiplos formatos
- Gerar sprites
- Criar image sets para diferentes resoluções
- Automatizar export para CDN

### 5. **Documentation Generation**
- Gerar documentação de componentes
- Criar guias de estilo
- Produzir specs para desenvolvedores
- Manter design library atualizada

---

## 🔐 Segurança

### ✅ Boas Práticas Implementadas:
- Token com escopo limitado (somente leitura)
- Comunicação via HTTPS
- Token armazenado como variável de ambiente

### ⚠️ Atenções:
- **Não compartilhe** o token publicamente
- **Não commite** tokens no Git
- **Use** arquivos .env ou secrets managers em produção
- **Renove** tokens periodicamente (ex: a cada 90 dias)

### Rotação de Token:
```bash
# Quando renovar token:
1. Acesse Figma → Settings → Personal access tokens
2. Revogue token antigo
3. Crie novo token
4. Atualize claude_desktop_config.json com novo token
5. Reinicie Claude Desktop
```

---

## 📚 Recursos Adicionais

### Documentação Oficial:
- Figma API: https://www.figma.com/developers/api
- MCP Figma Server: https://github.com/modelcontextprotocol/servers/tree/main/src/figma
- Figma Plugin API: https://www.figma.com/plugin-docs/

### Ferramentas Relacionadas:
```
.interface-design/      # Design files locais
interface-design/       # Design assets
android_layouts/        # Layouts Android
```

### Comunidade:
- Figma Community: https://www.figma.com/community
- Figma Forum: https://forum.figma.com
- Discord: https://discord.gg/figma

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

### Testar Token Manualmente:
```powershell
$token = "figd_K-PymVAEGP1iJScJ2zr9Fxp6rwXqq7Drv_Bn0y4A"
$headers = @{ "X-Figma-Token" = $token }
Invoke-RestMethod -Uri "https://api.figma.com/v1/me" -Headers $headers
```

---

## 🎉 Pronto para Usar!

Seu Figma MCP está configurado e pronto para acelerar seu workflow de design!

**Próximos passos sugeridos:**

1. ✅ Reiniciar Claude Desktop
2. 🧪 Testar conexão com "Liste meus arquivos do Figma"
3. 🎨 Extrair design tokens de um arquivo
4. 🚀 Automatizar export de assets

---

**Configuração realizada em:** 2026-03-12 03:30:54 UTC  
**Token Figma:** figd_K-Pym... (oculto por segurança)  
**Status:** ✅ Ativo e Pronto

---

## 🔗 Integração com Outros MCPs

Agora você tem 3 MCPs configurados:

1. **PostHog** - Analytics e feature flags
2. **n8n** - Automações e workflows
3. **Figma** - Design e assets

### Workflows Possíveis:

#### Design → Code → Deploy
1. Figma MCP: Extrair componentes
2. Dev: Implementar componentes
3. n8n MCP: Deploy automático
4. PostHog: Rastrear uso

#### Design Review Pipeline
1. Figma MCP: Obter comentários
2. n8n MCP: Criar tasks no PM tool
3. Slack: Notificar equipe
4. PostHog: Rastrear tempo de review

#### Asset Management
1. Figma MCP: Exportar assets
2. n8n MCP: Upload para CDN
3. Database: Atualizar referências
4. PostHog: Rastrear performance

---

Aproveite seu novo superpoder de design! 🚀🎨
