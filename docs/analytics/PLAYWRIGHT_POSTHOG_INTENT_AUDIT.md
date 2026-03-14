# Playwright PostHog Intent Audit

Status: `draft`  
Owner sugerido: `Frontend + Backend + Product Analytics`  
Última atualização: `2026-03-13`

## Objetivo

Validar na VM se os principais sinais de intenção do produto estão chegando corretamente ao pipeline analítico, cobrindo:

- emissão no browser via `track(...)`
- request para `/api/v1/analytics/track`
- request de ingestão para PostHog
- presença de `session_id` no payload backend
- detecção de quebras de runtime que impedem tracking

## Diagnóstico

Hoje o stack de tracking tem três camadas:

1. Frontend
- camada canônica em `AB0-1-front/lib/analytics/index.ts`
- PostHog só dispara com consentimento
- eventos também vão para `/api/v1/analytics/track`

2. Backend
- `Api::V1::AnalyticsController#track`
- normaliza aliases, exige `company_id` para vários eventos, injeta metadados de request

3. Forwarding
- `Analytics::TrackEventService`
- persiste evento e tenta forward para PostHog quando `POSTHOG_API_KEY` está presente

Isso gera quatro riscos reais:

- o evento pode existir no código e não disparar por erro de runtime
- o evento pode disparar no browser e não chegar no backend
- o backend pode receber o evento com payload incompleto, especialmente sem `session_id`
- o evento pode chegar no backend e não ser observado na rede do PostHog

## O Que o Script Testa

O script `scripts/playwright/posthog-intent-audit.js` valida:

- consentimento LGPD forçado no navegador para liberar analytics
- session fixa em `sessionStorage` para facilitar rastreio
- interceptação de `window.posthog.capture`
- requests para `/api/v1/analytics/track`
- requests para `/ingest/*` ou host do PostHog
- fluxo público mínimo:
  - home
  - categoria
  - clique em empresa, se disponível
- fluxo autenticado opcional:
  - login
  - dashboard company

## Eventos Mínimos Esperados

Obrigatórios no diagnóstico atual:

- `page_view`
- `category_selected`

Desejáveis:

- `company_card_click`
- `dashboard_viewed`

## Como Rodar na VM

Na raiz do repositório:

```bash
node scripts/playwright/posthog-intent-audit.js
```

Com URL específica:

```bash
TARGET_URL=https://www.avaliasolar.com.br node scripts/playwright/posthog-intent-audit.js
```

Com login para validar dashboard:

```bash
TARGET_URL=https://www.avaliasolar.com.br \
LOGIN_EMAIL=seu-email@dominio.com \
LOGIN_PASSWORD='sua-senha' \
node scripts/playwright/posthog-intent-audit.js
```

Modo visível:

```bash
HEADLESS=false node scripts/playwright/posthog-intent-audit.js
```

Com arquivo de saída customizado:

```bash
OUTPUT_PATH=/tmp/posthog-audit.json node scripts/playwright/posthog-intent-audit.js
```

Com binário específico do sistema:

```bash
PLAYWRIGHT_EXECUTABLE_PATH=/usr/bin/google-chrome \
node scripts/playwright/posthog-intent-audit.js
```

Com channel explícito:

```bash
PLAYWRIGHT_CHANNEL=chrome node scripts/playwright/posthog-intent-audit.js
```

## Saída

O script gera um JSON em:

`test-results/posthog-intent-audit.json`

Campos principais:

- `browser_captures`
- `backend_requests`
- `backend_responses`
- `posthog_requests`
- `posthog_responses`
- `findings`
- `errors`
- `summary.verdict`

## Critério de Sucesso

`pass` quando:

- eventos obrigatórios foram observados
- houve request de ingestão para PostHog
- nenhum request backend relevante saiu sem `metadata.session_id`

`warn` quando:

- falta evento obrigatório
- não houve request para PostHog
- há payload backend sem `session_id`
- houve erro de runtime no browser

## Leitura Operacional

Se `browser_captures > 0` e `posthog_requests = 0`:

- o frontend está disparando, mas a ingestão PostHog está bloqueada ou mal configurada

Se `browser_captures > 0` e `backend_requests = 0`:

- o problema está na sincronização frontend -> backend

Se `backend_requests > 0` e `posthog_requests = 0`:

- o backend recebeu o evento, mas o forward do PostHog pode estar desabilitado ou quebrado

Se houver `pageerror` ou `console:error`:

- trate isso como falha de instrumentação, não só de UI

## Próximos Passos Recomendados

- expandir a matriz de cenários para blog, wizard e dashboard
- transformar os eventos obrigatórios em baseline por jornada
- rodar esse script na VM após deploy
- publicar o JSON como artefato de release ou smoke test

## Nota de Ambiente

No host local desta sessão, a execução completa não fechou porque o Chromium baixado pelo Playwright ficou incompatível com o macOS legado do ambiente.

Isso não muda a estratégia do auditor. Para uso real, a recomendação é:

- rodar na VM Linux de deploy
- ou apontar `PLAYWRIGHT_EXECUTABLE_PATH` para um Chrome do sistema
