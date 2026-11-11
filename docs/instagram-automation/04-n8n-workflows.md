# Especificação Detalhada dos Workflows n8n — Instagram Autonomous Engine

Este documento documenta os 8 workflows do n8n desenvolvidos para a automação de publicações do Avalia Solar no Instagram (`@avalia_solar`).

---

## 1. Visão Geral dos Workflows

| Arquivo | Nome | Gatilho | Responsabilidade |
| :--- | :--- | :--- | :--- |
| `WF-IG-00-preflight.json` | Preflight | Manual / Cron | Validação de credenciais, token Meta e conta `@avalia_solar` |
| `WF-IG-01-discovery.json` | Discovery | Cron 09:00 BRT | Busca de artigos na API Rails, hash de conteúdo e seleção |
| `WF-IG-02-ai-editorial.json` | AI Editorial | ExecuteWorkflow | Geração de copy e headline via GPT-4o em JSON Schema estrito |
| `WF-IG-03-media-render.json` | Media Render | ExecuteWorkflow | Chamada ao endpoint Edge OG 1080×1350 px e validação de imagem |
| `WF-IG-04-approval.json` | Approval Gate | ExecuteWorkflow | Geração de token HMAC, disparo de notificação e espera de aprovação |
| `WF-IG-05-publisher.json` | Publisher | ExecuteWorkflow | Kill-switch, container status polling loop e publicação Meta v21.0 |
| `WF-IG-06-analytics.json` | Analytics | ExecuteWorkflow | Telemetria no PostHog e atualização de status |
| `WF-IG-99-error-handler.json` | Error Handler | ErrorTrigger | Captura global de falhas, contexto de execução e alerta de incidentes |

---

## 2. WF-IG-00-preflight

### Objetivo
Garantir que a API da Meta está acessível, o token possui as permissões necessárias e o ID do usuário corresponde à conta verificada `@avalia_solar`.

### Variáveis Utilizadas
- `META_IG_USER_ID`: ID da conta do Instagram Business no Meta Graph API.
- `META_ACCESS_TOKEN`: Token de longa duração (System User ou Page Access Token).
- `INSTAGRAM_AUTOPUBLISH_ENABLED`: Kill-switch global.

### Fluxo de Execução
1. **Manual / Test Trigger**: Permite disparo sob demanda na interface do n8n.
2. **Init & Environment Check**: Extrai variáveis de ambiente e valida presença do token.
3. **Query Meta IG Profile**: `GET https://graph.facebook.com/v21.0/{ig_user_id}?fields=id,username,name,followers_count,media_count`.
4. **Validate Identity & Safeguards**: Valida se `username.toLowerCase() === 'avalia_solar'`. Lança exceção bloqueante se a conta for incorreta.

---

## 3. WF-IG-01-discovery

### Objetivo
Identificar pautas relevantes e artigos técnicos recém-publicados no blog do Avalia Solar, evitando repetições via hash criptográfico.

### Gatilho
- Cron diário às `09:00 BRT` (`12:00 UTC`): `0 12 * * *`.
- Trigger manual para testes.

### Fluxo de Execução
1. **Fetch Latest Articles**: `GET https://api.avaliasolar.com.br/api/v1/articles?per_page=10`.
2. **Process & Select Candidate**:
   - Calcula SHA-256 de `slug|title`.
   - Normaliza campos de resumo e texto para até 1500 caracteres.
   - Seleciona o melhor candidato baseado em critérios de completude editorial.
3. **Candidate Found?**: If node de validação.
4. **Dispatch to AI Editorial**: Executa `WF-IG-02-ai-editorial` passando o candidato selecionado.

---

## 4. WF-IG-02-ai-editorial

### Objetivo
Gerar legenda, headline de impacto, gancho (hook), contextualização de mercado e hashtags estratégicas usando GPT-4o.

### Prompt e Formato
- Modo: `response_format: { "type": "json_object" }`.
- Temperatura: `0.4` (alta consistência técnica e precisão terminológica).
- Diretrizes: Tom de autoridade transparente, vocabulário do setor solar brasileiro (GD, Lei 14.300, Aneel, Mercado Livre).

### Montagem da Legenda
A legenda gerada é formatada seguindo a estrutura:
```text
[Hook]

[Context]

[Explanation]

💡 Insight Avalia Solar:
[Insight]

👉 [CTA]
🔗 Leia a matéria na íntegra: [URL Canônica]

.
.
.
#energiasolar #avaliasolar #mercadolivredeenergia #fotovoltaico #sustentabilidade
```

---

## 5. WF-IG-03-media-render

### Objetivo
Renderizar dinamicamente o card gráfico oficial no formato Instagram Feed (1080×1350 px, proporção 4:5) via Next.js Edge OG route.

### Endpoint Utilizado
`GET https://www.avaliasolar.com.br/api/social/render-post?title={headline}&category={category}&format=feed`

### Validação Técnica
- O nó `Verify Image Renderability` faz um request `GET` garantindo status `200 OK` e tipo `image/png`.
- Apenas imagens com URL pública válida e dimensões 1080×1350 px são aprovadas para o estágio seguinte.

---

## 6. WF-IG-04-approval

### Objetivo
Human-in-the-loop: garantir que nenhuma publicação vá ao ar sem revisão explícita do time de marketing/operações.

### Mecanismo de Segurança HMAC
- Gera um `publication_id` único e um token HMAC SHA-256 usando `APPROVAL_HMAC_SECRET`.
- Links de aprovação/rejeição gerados:
  - `https://n8n.avaliasolar.com.br/webhook/ig-approval-action?id={id}&action=approve&token={token}`
  - `https://n8n.avaliasolar.com.br/webhook/ig-approval-action?id={id}&action=reject&token={token}`

### Disparo da Notificação
Envia webhook com o preview completo da imagem, texto da legenda e botões de ação para o canal de operações.

---

## 7. WF-IG-05-publisher

### Objetivo
Executar a publicação na API da Meta seguindo rigorosamente o fluxo de dois passos e polling de status do container.

### Etapas Críticas
1. **Kill-Switch Check**:
   - Se `INSTAGRAM_AUTOPUBLISH_ENABLED !== 'true'`, o fluxo não chama a Meta API, registra log de `DRY_RUN` e finaliza com segurança.
2. **Criação do Container**:
   - `POST https://graph.facebook.com/v21.0/{ig_user_id}/media`
   - Payload: `image_url`, `caption`, `access_token`.
   - Retorna: `creation_id`.
3. **Polling de Status do Container**:
   - Aguarda 5 segundos (`WaitBeforeStatusPoll`).
   - `GET https://graph.facebook.com/v21.0/{creation_id}?fields=status_code,status`.
   - Condição: `status_code === 'FINISHED'`.
4. **Publicação Efetiva**:
   - `POST https://graph.facebook.com/v21.0/{ig_user_id}/media_publish?creation_id={creation_id}`.
   - Retorna: `media_id`.
5. **Verificação de Confirmação**:
   - `GET https://graph.facebook.com/v21.0/{media_id}?fields=id,permalink,timestamp`.
6. **Encaminhamento**:
   - Despacha o resultado para `WF-IG-06-analytics`.

---

## 8. WF-IG-06-analytics

### Objetivo
Registrar telemetria de publicação no PostHog para acompanhamento de distribuição e alcance social.

### Evento Enviado
- `event`: `instagram_publication_succeeded`
- `distinct_id`: `instagram_avalia_solar`
- `properties`:
  - `media_id`: ID oficial no Instagram.
  - `permalink`: Link público do post (ex: `https://www.instagram.com/p/...`).
  - `platform`: `instagram`
  - `account`: `avalia_solar`
  - `published_at`: Timestamp ISO 8601.

---

## 9. WF-IG-99-error-handler

### Objetivo
Capturar qualquer erro de execução em qualquer um dos workflows acima, evitando falhas silenciosas e gerando alertas operacionais com severidade P1.

### Estrutura do Incidente
- `incident_id`: Identificador único do incidente.
- `severity`: `P1`.
- `failed_node`: Nome do nó que falhou.
- `error_message`: Mensagem da exceção.
- `error_stack`: Stack trace sanitizado.
- `execution_id`: Link da execução no n8n.
