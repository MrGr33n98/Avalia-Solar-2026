# Feature Specification: CRM Email Tracking + Timeline Realtime

**Feature Branch**: `feat/crm-email-timeline-realtime`  
**Status**: Implementação local parcial; gates operacionais permanecem BLOCKED. Consulte [tasks.md](tasks.md) e [go-live-checklist.md](go-live-checklist.md).
**Language**: pt-BR

## Contexto

O CRM já persiste `EmailMessage`/`EmailEvent`, recebe eventos SNS verificados, reescreve links, mantém suppression/cadências e tem conexão ActionCable autenticada. Hoje a timeline monta dados no controller, o frontend usa `description` e cache em memória, sinais de pixel não são classificados/deduplicados e não existe canal/cursor da timeline Sales. O indicador de abertura deve significar somente sinal observado.

## User stories

### US1 — Lifecycle confiável de email (P0)

Como vendedor, quero distinguir aceitação, entrega, atraso, rejeição, bounce, complaint, unsubscribe, abertura detectada, clique e reply para decidir o próximo contato com evidência auditável.

**Independent test**: mensagem sintética e provedores fakes; replays e eventos fora de ordem não duplicam transições, métricas ou efeitos de suppression.

### US2 — Timeline unificada e tipada (P0)

Como vendedor, quero ver em uma única linha da oportunidade o email e seu lifecycle, com autor real, prévia segura e sinais classificados, sem atividades de email duplicadas.

**Independent test**: aggregate com email/activities/tasks/notes/quotes; tenant A não observa nada de B e uma mensagem aparece uma vez com lifecycle ordenado.

### US3 — Atualização ao vivo com recuperação (P1)

Como vendedor, quero que eventos persistidos apareçam sem refresh manual e que reconexão recupere deltas perdidos, sem duplicar itens.

**Independent test**: broadcast após commit, canal desconectado/reconectado e cursor delta reproduzível.

### US4 — Reply inbound e parada de cadence (P0 para afirmar lifecycle completo)

Como vendedor, quero que uma resposta recebida seja associada à thread/contato/oportunidade corretos, apareça na timeline e interrompa a cadence.

**Independent test**: mensagem inbound sintética assinada pelo adapter escolhido, idempotente, cross-tenant recusada e cadence parada.

### US5 — Operação observável e controlada (P1)

Como operador, quero distinguir ausência de sinal de falha de tracking/realtime e inspecionar prontidão sem revelar segredos ou PII.

## Requisitos funcionais

- **FR-001**: URLs de pixel, link e unsubscribe MUST usar `EMAIL_TRACKING_HOST` em backend e worker; em produção o host ausente MUST falhar preflight/envio, sem fallback a `APP_HOST`.
- **FR-002**: Pixel MUST responder GIF 1x1 com `Content-Type: image/gif`, `Cache-Control: no-store, no-cache, must-revalidate, max-age=0`, `Pragma: no-cache` e `Expires: 0`, inclusive para token inválido, sem revelar existência da mensagem.
- **FR-003**: Pixel MUST ser renderizável por cliente de email, HTTPS, token opaco/não enumerável e específico da mensagem; não usar `display:none`.
- **FR-004**: A aplicação MUST chamar o evento de pixel `open_signal`; não usar “lido” ou “aguardando leitura” como semântica do domínio.
- **FR-005**: Evento MUST preservar origem, `received_at`, dedupe key, classificação e versão do schema, mantendo provider event id e raw event imutáveis/auditáveis.
- **FR-006**: A métrica comercial MUST separar contagens brutas/únicas de opens e clicks e classes `human_likely`, `proxy`, `bot`, `scanner`, `unknown`; classificação incerta MUST permanecer `unknown` e nenhuma confiança percentual será inventada.
- **FR-007**: Eventos SES/SNS são fonte canônica para `delivery`, `delay`, `bounce`, `complaint`, `reject`; Avalia Pixel para `open_signal`; Avalia Link para `click`; adapter inbound para `reply`. SNS open/click, se mantidos, serão raw provider events e não serão somados como sinais comerciais canônicos.
- **FR-008**: Delivery e engagement MUST ser dimensões distintas; eventos fora de ordem/retries não podem regredir status final nem apagar timestamps existentes.
- **FR-009**: Bounce, complaint e unsubscribe MUST criar/retê suppression e interromper envios/cadências; não haverá reativação automática. Click/open não param cadence sem regra aprovada.
- **FR-010**: Replies MUST ser ingeridas por adapter autenticado e idempotente, resolvidas para thread/contato/oportunidade dentro do tenant e parar cadence após commit.
- **FR-011**: Timeline MUST usar EmailMessage como aggregate root para eventos de email e nunca duplicar `email_sent`, open, click ou reply como itens Activity concorrentes.
- **FR-012**: Timeline query MUST aplicar autorização e TenantScope. Evento de outra oportunidade da mesma conta MUST ficar fora; atividade account-only será incluída somente pela regra documentada.
- **FR-013**: API MUST retornar DTO tipado com ator, kind, timestamp, email, engagement, delivery e lifecycle; frontend MUST não interpretar descrição localizada para obter contadores/estados.
- **FR-014**: Preview MUST preferir texto; HTML MUST ser sanitizado, convertido a texto, normalizado e truncado entre 160–240 caracteres. Corpo integral exige autorização explícita.
- **FR-015**: ActionCable MUST autorizar usuário, empresa e oportunidade antes de transmitir. Broadcast pequeno ocorrerá somente após commit e não conterá corpo/email/PII.
- **FR-016**: Timeline MUST possuir cursor monotônico e endpoint delta `after`; reconnect recupera todos os eventos persistidos sem duplicação.
- **FR-017**: Frontend MUST refazer delta após broadcast, reconnect e `visibilityState=visible`; quando desconectado, fazer polling de 15–30s apenas com painel visível. “Ao vivo” só pode aparecer após subscription conectada.
- **FR-018**: UI MUST exibir “Entregue”, “Abertura detectada”, “Clique detectado” e “Resposta recebida” como sinais distintos; notificações devem deduplicar e não alertar a cada reload.
- **FR-019**: Coletar somente telemetria sem PII em labels; IP bruto não será exibido e terá retenção minimizada/documentada.
- **FR-020**: Readiness MUST distinguir DB/Redis/Sidekiq, provider, tracking host/endpoint, SNS e ActionCable; health não deve revelar credenciais.
- **FR-021**: Mudanças não podem enviar email real em specs, escrever em banco de produção, publicar/deployar ou marcar go-live sem E2E sintético em staging.

## Success criteria (metas, não resultados)

- **SC-001**: Tracking HTTP→commit p95 < 500 ms sob carga staging documentada.
- **SC-002**: Commit→broadcast p95 < 500 ms e evento ingerido→UI p95 < 2 s com conexão saudável.
- **SC-003**: Fallback atualiza em até 30 s quando timeline visível e socket desconectado.
- **SC-004**: 100% dos eventos persistidos depois do cursor são recuperados após reconexão; duplicação de provider_event_id e exposição cross-tenant = 0.
- **SC-005**: E2E staging percorre enviar/entregar/pixel/click/reply/cadence/reconnect sem refresh e sem item duplicado.
- **SC-006**: Cada gate operacional no go-live checklist tem evidência real datada; nenhum SLO é PASS sem medição.

## Edge cases

Token inválido/rotacionado; tracking desligado; carregamentos repetidos; proxies/bots/scanners; webhooks atrasados, duplicados ou fora de ordem; destinatário sem oportunidade; vínculo account-only; opportunity de outro tenant; HTML malformado; URL insegura; canal indisponível; cursor expirado; reply sem `In-Reply-To`; dois contatos com mesmo endereço; suppression já existente; usuário sem autorização na subscription; timeout/outage de Redis.

## Non-goals

Inferir leitura humana com pixel; scoring automático; parar cadence por open/click; integrar provider inbound sem decisão de produto/segredo/inbox; enviar a prospects reais durante validação; habilitar realtime em produção sem handshake e autorização comprovados.
