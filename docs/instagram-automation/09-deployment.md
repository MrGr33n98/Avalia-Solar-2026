# Guia de Implantação e Configuração dos Workflows n8n
## Avalia Solar — Instagram Autonomous Content Engine

**Documento:** Deployment & Setup Guide  
**Alvo:** Instância n8n `https://n8n.avaliasolar.com.br`  

---

## 1. Pré-Requisitos

1. Acesso administrativo à interface do n8n em `https://n8n.avaliasolar.com.br`.
2. Token de Usuário do Sistema Meta com as permissões `instagram_basic` e `instagram_content_publish`.
3. Instagram Account ID vinculado à conta `@avalia_solar`.
4. Chave de API da OpenAI (ou LLM compatível) para o motor editorial de copywriting.
5. Chave de API do PostHog (caso deseje telemetria analítica).

---

## 2. Configuração de Credenciais no n8n

Acesse **Settings** → **Credentials** → **New** e crie as seguintes credenciais:

1. **Credencial Meta Graph API (`meta_instagram_api`):**
   * Tipo: **Header Auth**
   * Name: `Authorization`
   * Value: `Bearer <META_SYSTEM_USER_ACCESS_TOKEN>`
2. **Credencial OpenAI (`openai_api`):**
   * Tipo: **OpenAI API**
   * API Key: `<OPENAI_API_KEY>`
3. **Credencial PostHog (`posthog_api`):**
   * Tipo: **Header Auth**
   * Name: `Authorization`
   * Value: `Bearer <POSTHOG_API_KEY>`

---

## 3. Importação dos Workflows

Na interface do n8n, crie uma pasta chamada **Instagram Engine** e importe os 8 arquivos JSON localizados em `n8n-workflows/instagram/`:

1. `WF-IG-00-preflight.json` (Validação de credencial e conta @avalia_solar)
2. `WF-IG-01-discovery.json` (Busca e deduplicação de artigos)
3. `WF-IG-02-ai-editorial.json` (Redação automatizada com IA)
4. `WF-IG-03-media-render.json` (Renderização de artes 1080×1350 px)
5. `WF-IG-04-approval.json` (Gateway de aprovação humana)
6. `WF-IG-05-publisher.json` (Publicação segura com polling e kill switch)
7. `WF-IG-06-analytics.json` (Telemetria operacional e PostHog)
8. `WF-IG-99-error-handler.json` (Tratamento centralizado de erros)

---

## 4. Checklist de Validação Pré-Ativação

- [ ] Executar o `WF-IG-00-preflight` manualmente e validar retorno com nome `@avalia_solar`.
- [ ] Executar o `WF-IG-01-discovery` e conferir a listagem de artigos recuperados da API Rails.
- [ ] Executar o `WF-IG-02-ai-editorial` e verificar se a saída JSON gerada cumpre a fórmula editorial.
- [ ] Executar o `WF-IG-03-media-render` e abrir a URL da imagem no navegador.
- [ ] Testar aprovação no `WF-IG-04-approval` via webhook simulado.
- [ ] Confirmar que no `WF-IG-05-publisher` o kill switch `INSTAGRAM_AUTOPUBLISH_ENABLED` está inicialmente como `false`.
- [ ] Ativar os agendamentos automáticos somente após a homologação completa da equipe.
