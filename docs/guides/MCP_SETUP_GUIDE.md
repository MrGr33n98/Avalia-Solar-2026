# 🔌 MCP Servers Configuration Guide

Este arquivo consolida a configuração de todos os servidores MCP (Model Context Protocol) utilizados no projeto **Avalia Solar**.

## 🛠️ Como Instalar

Para ativar esses servidores no seu Claude Desktop:

1. Abra o arquivo de configuração do Claude Desktop:
   - Caminho: `%APPDATA%\Claude\claude_desktop_config.json`
2. Copie o conteúdo do arquivo `MCP_CONFIG.json` (na raiz deste projeto).
3. Cole o conteúdo no arquivo de configuração do sistema.
4. **Reinicie o Claude Desktop**.

## 📦 Servidores Incluídos

| Servidor | Função | Status |
| :--- | :--- | :--- |
| **PostHog** | Analytics e Intenção de Compra | ✅ Configurado |
| **n8n-mcp** | Automação de Workflows (Sales/Operations) | ✅ Configurado |
| **Figma** | Acesso a designs e specs de UI/UX | ✅ Configurado |
| **GitHub** | Gestão de repositórios e PRs | ⚠️ Requer Token |
| **Firecrawl** | Web Scraping e busca avançada | ⚠️ Requer API Key |
| **Playwright** | Automação de browser e testes E2E | ✅ Pronto |
| **Context7** | Documentação técnica em tempo real | ✅ Pronto |
| **StitchMCP** | Integração de designs AI-generated | ✅ Pronto |

## 🔑 Configurações Necessárias

Alguns servidores requerem chaves de API manuais:

- **GitHub**: Gere um [Personal Access Token (classic)](https://github.com/settings/tokens) com escopo `repo`.
- **Firecrawl**: Obtenha sua chave em [firecrawl.dev](https://firecrawl.dev).

## 🚀 Configuração para OpenCode

O arquivo `opencode.json` foi gerado para permitir a integração direta com o editor **OpenCode**. 

### Como Ativar:
1. Certifique-se de que o arquivo `opencode.json` está na raiz do seu projeto.
2. No OpenCode, as ferramentas MCP serão carregadas automaticamente com base neste arquivo.
3. Para servidores remotos (como PostHog e n8n), a conexão é feita via SSE/HTTP.
4. Para servidores locais (como Figma, GitHub, Playwright), o OpenCode executará os comandos `npx` conforme definido.

### Autenticação no OpenCode:
Para servidores que requerem OAuth ou tokens via linha de comando:
```bash
opencode mcp auth github
opencode mcp auth firecrawl
```

---
*Gerado e atualizado para o ecossistema Avalia Solar e OpenCode em 2026-03-14.*
