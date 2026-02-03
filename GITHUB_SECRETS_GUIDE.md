

# 🔐 Guia de Configuração de Secrets do GitHub - Avalia Solar

Este guia detalha todos os secrets e variáveis que devem ser configurados no repositório do GitHub em **Settings > Secrets and variables > Actions**.

## 🔴 Secrets (Confidenciais - Devem ser adicionados em 'Secrets')

Estes valores são sensíveis e não devem ser expostos.

| Nome do Secret | Descrição | Como gerar/obter |
| :--- | :--- | :--- |
| `SSH_HOST` | IP ou Host do servidor de produção | Fornecido pelo provedor (ex: DigitalOcean) |
| `SSH_USER` | Usuário para acesso SSH | Geralmente `root` ou `deploy` |
| `SSH_PRIVATE_KEY` | Chave privada SSH para o servidor | Conteúdo do arquivo `~/.ssh/id_rsa` (ou similar) |
| `SSH_PORT` | Porta SSH do servidor | Padrão: `22` |
| `GITHUB_TOKEN` | Token de acesso ao GitHub | Gerado automaticamente pelo GitHub Actions |
| `RAILS_MASTER_KEY` | Chave mestra do Rails (Backend) | Conteúdo de `backend/config/master.key` |
| `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` | Chave de criptografia do Next.js | `openssl rand -base64 32` |
| `BETTER_AUTH_SECRET` | Secret para autenticação Better Auth | `openssl rand -base64 32` |
| `SENTRY_AUTH_TOKEN` | Token de autenticação do Sentry | [Sentry Settings](https://sentry.io/settings/account/api/auth-tokens/) |
| `POSTGRES_USER` | Usuário do banco de dados | Definido no `.env` do servidor |
| `POSTGRES_PASSWORD` | Senha do banco de dados | Definido no `.env` do servidor |
| `POSTGRES_DB` | Nome do banco de dados | Definido no `.env` do servidor (ex: `ab0`) |
| `SPACES_ACCESS_KEY_ID` | DigitalOcean Spaces Access Key | Painel DigitalOcean > API > Spaces Keys |
| `SPACES_SECRET_ACCESS_KEY` | DigitalOcean Spaces Secret Key | Painel DigitalOcean > API > Spaces Keys |

## 🔵 Variables (Configurações - Podem ser adicionados em 'Variables')

Estes valores não são sensíveis e podem ser visíveis.

| Nome da Variável | Descrição | Valor Padrão Sugerido |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_API_URL` | URL pública da API (v1) | `https://api.avaliasolar.com.br/api/v1` |
| `NEXT_PUBLIC_API_BASE_URL` | URL base da API | `https://api.avaliasolar.com.br` |
| `NEXT_PUBLIC_SITE_URL` | URL do site frontend | `https://avaliasolar.com.br` |
| `NEXT_PUBLIC_BETTER_AUTH_URL` | URL de auth (geralmente igual ao site) | `https://avaliasolar.com.br` |
| `NEXT_PUBLIC_GTM_ID` | ID do Google Tag Manager | `GTM-5RV76ZKR` |
| `NEXT_PUBLIC_ENABLE_ANALYTICS` | Ativar analytics | `true` |
| `SENTRY_ORG` | Organização no Sentry | `avalia-solar` |
| `SENTRY_PROJECT` | Projeto no Sentry | `frontend` |
| `SPACES_REGION` | Região do DigitalOcean Spaces | `nyc3` |
| `SPACES_BUCKET` | Nome do bucket no Spaces | `avalia-solar-assets` |
| `SPACES_ENDPOINT` | Endpoint do Spaces | `https://nyc3.digitaloceanspaces.com` |

---

## 🚀 Como Adicionar

1. Vá para o seu repositório no GitHub.
2. Clique em **Settings** (Configurações).
3. No menu lateral esquerdo, clique em **Secrets and variables** > **Actions**.
4. Use a aba **Secrets** para os valores sensíveis (botão `New repository secret`).
5. Use a aba **Variables** para os valores de configuração (botão `New repository variable`).

## ⚠️ Segurança

- **NUNCA** coloque secrets diretamente no código (hardcoded).
- Se um secret for exposto, revogue-o imediatamente e gere um novo.
- Use o princípio do privilégio mínimo para tokens de API.
