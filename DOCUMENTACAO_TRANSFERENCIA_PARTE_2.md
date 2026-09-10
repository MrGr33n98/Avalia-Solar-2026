# Dossiê de transferência — Parte 2: referência técnica e operacional

> Complemento da Parte 1. Este arquivo aprofunda contratos, fluxos, limites,
> configuração, deploy e operação. Ele é baseado em leitura estática do commit
> 59aab97 em 30/07/2026; não confirma que integrações externas estejam ativas.

## 1. Como navegar entre as partes

| Documento | Papel |
| --- | --- |
| DOCUMENTACAO_TRANSFERENCIA_PROJETO.md | Visão integral, arquitetura, onboarding, inventário de áreas e checklist executivo. |
| DOCUMENTACAO_TRANSFERENCIA_PARTE_2.md | Contratos técnicos, fluxos de dados, proteção, runbooks e diagnóstico. |
| config/routes.rb | Fonte de verdade de verbos, paths e controllers da API. |
| db/schema.rb e db/migrate | Fonte de verdade do banco e evolução. |
| .github/workflows | Fonte de verdade do CI/CD. |
| docs e relatórios na raiz | Contexto histórico, decisões, auditorias e propostas. |

A regra prática é: este documento explica o sistema; o código decide o que ele
faz. Ao implementar, sempre abra controller, service, policy e spec associados.

## 2. Contrato comum da API

### 2.1 Base, versão e content type

A API de negócio usa a raiz /api/v1. Em produção a origem é
https://api.avaliasolar.com.br; em desenvolvimento, normalmente
http://localhost:3001.

As respostas são JSON. O BaseController contém paginação e Pundit e normaliza os
principais erros:

| Situação | Status esperado | Código de resposta |
| --- | --- | --- |
| Sem sessão válida | 401 | UNAUTHORIZED |
| Papel/membership insuficiente | 403 | FORBIDDEN, COMPANY_ACCESS_REQUIRED ou AUTHORIZATION_ERROR |
| Registro ausente | 404 | NOT_FOUND |
| Parâmetro obrigatório ausente | 400 | BAD_REQUEST |
| Validação ActiveRecord falhou | 422 | UNPROCESSABLE_ENTITY, com details quando disponível |
| Throttle Rack::Attack | 429 | RATE_LIMIT_EXCEEDED, com Retry-After |
| Falha interna | 500 | Varia por controller; deve ser logada sem vazar PII/segredo |

Formato de erro padronizado pelo BaseController:

~~~json
{
  "code": "CODIGO_EM_MAIUSCULAS",
  "message": "Mensagem segura para o cliente",
  "details": ["opcional", "somente quando apropriado"]
}
~~~

Clientes não devem decidir comportamento com base no texto de message. Usem
status e code. Para 429, respeitem Retry-After em vez de fazer polling agressivo.

### 2.2 Autenticação e autorização

A API aceita token JWT no header Authorization com o esquema Bearer. Durante a
transição, também aceita cookie assinado jwt_token. O algoritmo de decodificação
é HS256, com secret_key_base Rails.

| Fluxo | Rota/resultado |
| --- | --- |
| Login | POST auth/login; devolve token e usuário. Empresa recebe lista de empresas ativas e redirect sugerido. |
| Cadastro | POST auth/register ou auth/signup; exige termos aceitos; usuário company nasce pendente e os demais ativos. |
| Sessão | GET auth/me; usado pelo portal para restaurar contexto. |
| Renovação | POST auth/refresh; requer refresh token válido. |
| Saída | POST auth/logout ou auth/logout_all; revoga token(s), limpa refresh/cookies e gera evento analytics. |
| Recuperação | POST auth/forgot_password, reset_password e resend_confirmation. |
| OAuth | Fluxos Devise em /users/auth/google_oauth2, /users/auth/linkedin e /users/auth/facebook. |

O portal usa AuthContext. Depois do login:

- role review vai para review-dashboard;
- role company consulta contexto de membership, seleciona empresa ativa e vai para
  dashboard com company_id, ou para select-company;
- demais papéis vão para home.

A autorização de empresa não depende apenas de role company. O usuário precisa
de CompanyMember ativo, salvo quando admin. Para recurso de billing há policy
específica. Não confie em company_id enviado pelo browser sem validar membership.

### 2.3 Metadados de borda e atribuição

O BaseController captura os headers X-User-City, X-User-State, X-User-Country,
X-Request-ID, X-Edge-Signature e X-Edge-Time. Se houver assinatura e
SHARED_SECRET estiver configurado, ela é validada via HMAC SHA-256.

request_metadata inclui IP, referenciador sanitizado, user agent, rota, cidade,
estado e parâmetros UTM normalizados. UTM aceita source, medium, campaign,
term, content e identificadores de anúncio. Valores são normalizados e limitados.

Ao criar endpoints, use request_metadata em eventos internos apenas quando a
finalidade justificar. Evite registrar body integral de lead, token, senha ou
documentos.

## 3. Mapa detalhado de endpoints

A lista abaixo é organizada por função, não substitui routes.rb. Recursos REST
seguem o plural indicado e podem ter as operações padrão index/show/create/
update/destroy conforme a rota declarada.

### 3.1 Descoberta pública e SEO

| Recurso | Operações notáveis | Uso e cuidados |
| --- | --- | --- |
| companies | index, show, featured, by_slug, states, cities, locations, mine | Busca/listagem/perfil. Coleções grandes precisam paginação e filtros. mine é autenticado. |
| companies/:id | categories, catalog, social_proof, badges, widget_data, views_count, track_view | Perfil público e telemetria. track_view é mutação e deve resistir a abuso. |
| local_solar_pages | show por estado ou estado/cidade | Landing SEO local com estatísticas, empresas e filtros. |
| categories | CRUD, tree, featured, by_slug, empresas/produtos/banners/contexto | Taxonomia e páginas de setor. Mudanças podem afetar SEO e ranking. |
| products | index, show, filters, compare, reviews | Catálogo público de leitura; escrita fica no dashboard privado. |
| search | index, all, suggest | Busca geral; trate entrada como não confiável e respeite limites. |
| seo_pages, sitemaps | show e sitemap local | Renderização/descoberta por buscadores. Validar canonical e indexação. |
| articles e faqs | CRUD/destaque/related, votos/views | Conteúdo público e gestão com regras de permissão. |

### 3.2 Reputação, reviews e trust

| Recurso | Operações notáveis | Regra crítica |
| --- | --- | --- |
| reviews | index, show, create, update, destroy, mine, vote | Review exige comentário ou critérios; protege autoavaliação e pode passar por moderação. |
| admin/reviews | index/show, pending, approve, reject, flag | Exclusivo para administração/moderação. |
| campaign_reviews | index/show | Reviews vinculadas a campanhas. |
| sector_ratings | summary, questions e create por empresa | Critérios por categoria/empresa. |
| review_forms/:token | consulta, submit, evento e QR code | Token público deve ser tratado como identificador sensível e não logado em excesso. |
| trust | profile e widgets/config | Dados de confiança para perfil/widget. |
| badges | consulta por slug; empresa pode listar selos | Não emitir selo apenas por cliente sem regra server-side. |

O modelo Review tem estados pending, approved, rejected, in_analysis, flagged e
contested. Também há verificação unverified, pending, in_review,
manually_verified e rejected. O nome público é anonimizado sem consentimento
adequado. Uma alteração em exibição de review precisa preservar esses controles.

### 3.3 Leads, consentimento e intenção

| Recurso | Operações | Regra crítica |
| --- | --- | --- |
| leads | create, index, show, mine, wizard_create | Index é empresa/admin autenticado e sujeito a feature access. |
| leads/:id | send_otp, resend_otp, verify_otp, wizard_result | Não vazar dados por ID enumerável; validar ownership/acesso. |
| lead_wizards/resolve | Resolve versão/campos do wizard | Consistência entre categoria, empresa e versão publicada. |
| gated_downloads e material_downloads | captura e arquivo | Material é superfície de lead; aplica throttle mais rigoroso. |
| consent | log, revoke, status | Alterações precisam ser auditáveis e respeitadas em automações. |
| identity | stitch, track_session | Correlaciona sessão anônima e usuário; cuidado LGPD. |
| intent_scores/signals | index/show/summary/recalculate e create | Recalcular é potencialmente pesado; exige autorização. |
| analytics | track, events/track, conversions, overview, funnel | Não aceitar evento fora de catálogo/sem sanitização. |

A criação por wizard valida dados de contato, consentimento e o gate de orçamento
da empresa. Há honeypot no controller e OTP com TTL, cooldown e limite de
tentativas no modelo Lead. A distribuição pode envolver uma ou mais empresas,
portanto nunca substitua a relação LeadDistribution por simples cópia de campo.

### 3.4 Área empresarial e dashboard

| Grupo | Operações principais |
| --- | --- |
| company_access | context, select_active_company e requests de acesso |
| company/members | CRUD e invite |
| company/pending_changes | index/show |
| company_dashboard | stats, analytics, ranking, reputation, intent, trust, mídia, vídeos, atualizações de perfil, CTAs, categorias, banners, social proof e market insights |
| dashboard | me, analytics, leads, catálogo privado e company update |
| company_admin | projetos, materiais, assets, lead forms, conteúdo, FAQs, review forms, financing profile/partners/offers e export de content leads |
| notifications | listagem, unread count, filtros, marcar lida, archive/unarchive, preferências |

Mudanças visíveis de empresa podem entrar em PendingChange. Não atualize direto
uma coluna moderada apenas porque a UI pede. A regra de idempotência de pending
changes e o workflow de aprovação existem para evitar publicação duplicada ou
fraude de perfil.

### 3.5 Chat, inbox e realtime

| Grupo | Operações |
| --- | --- |
| chat IA | sessions create/show, messages create, leads create, recomendações e feedback da resposta |
| inbox | lista de sessões, mensagens, modo, leitura e arquivamento |
| P2P conversations | index/create, unread_count, read, resolve, reopen, block, report, events e direct_messages |
| push_tokens | create |
| ActionCable | ChatSessionChannel, CompanyDashboardChannel, CompanyInboxChannel, ConversationChannel e ConversationListChannel |

O frontend só deve abrir realtime após ter token/contexto válido. Em caso de
falha, mantenha modo degradado de leitura/polling cuidadosamente limitado; não
reconecte em loop sem backoff. Teste WebSocket atrás de HTTPS e proxy Nginx
usando Upgrade/Connection corretamente.

### 3.6 Banners, campanhas e monetização

| Recurso | Operações |
| --- | --- |
| banners/banner_globals/banner_offers | Consulta pública de slots e ofertas |
| banner_events | Criação de evento de impressão/clique |
| company dashboard banners | CRUD e submit para aprovação |
| billing | plans, subscription, checkout, portal, enterprise_leads, webhooks/stripe |
| payments legados | create_intent, release_milestone e webhooks por provider |
| company_webhooks | CRUD de webhook por empresa |

Banner event é dado de faturamento/ROI: deduplicação, IP hash, user agent hash,
UTM e timestamp importam. Evite mexer em CTR sem entender BannerDailyStat e o
pipeline de agregação.

## 4. Fluxos de negócio implementados

### 4.1 Cadastro, confirmação e entrada

~~~mermaid
sequenceDiagram
  participant U as Usuário
  participant W as Portal/Mobile
  participant A as API Auth
  participant D as PostgreSQL
  participant M as Mailer
  participant P as PostHog/Analytics
  U->>W: envia dados e termos aceitos
  W->>A: POST auth/register
  A->>A: valida termos, role e localização
  A->>D: cria usuário (company fica pending)
  A->>M: envia confirmação
  A->>P: registration_completed
  A-->>W: usuário/token conforme fluxo
  U->>W: confirma e-mail
  W->>A: POST auth/confirm_email
  U->>W: entra
  W->>A: POST auth/login
  A->>P: login_completed e identify
  A-->>W: token, usuário, empresas e redirect
~~~

Em produção, login de usuário não confirmado é bloqueado. Desenvolvimento pode
ser mais permissivo. Teste sempre os dois contextos antes de alterar auth.

### 4.2 Busca até lead

~~~mermaid
sequenceDiagram
  participant V as Visitante
  participant N as Next.js
  participant A as Rails
  participant D as PostgreSQL/Redis
  participant L as Lead/Distribuição
  participant S as Sidekiq
  V->>N: pesquisa categoria/local
  N->>A: GET categories, search ou companies
  A->>D: consulta e cache
  A-->>N: empresas/ranking/filtros
  V->>N: abre perfil e inicia wizard
  N->>A: GET lead_wizards/resolve
  V->>N: envia contato, projeto, UTM e consentimento
  N->>A: POST leads/wizard_create
  A->>A: honeypot, validações e quote feature
  A->>L: persiste lead e distribuição
  A->>S: analytics/notificação assíncronos
  A-->>N: resultado/OTP quando necessário
~~~

Pontos de quebra comuns: empresa sem recurso pago, versão de wizard não
publicada, campos obrigatórios divergentes, CORS, throttle, e-mail OTP e
membership de empresa para leitura posterior.

### 4.3 Review e agregação de reputação

1. Usuário envia review por perfil, lead, chat, formulário personalizado ou QR.
2. API valida rating, comentário/critérios, autoavaliação, plano para destaque e
   limites de featured.
3. Review é persistida com status/moderação e consentimento adequado.
4. Callback enfileira agregação, analytics e notificação.
5. Worker atualiza agregados/rating/trust e invalida cache de social proof.
6. Dashboard e perfil leem dados derivados; moderação pode aprovar/rejeitar,
   responder, verificar ou registrar logs de decisão.

Nunca atualize rating_avg manualmente em controller ou banco sem passar pela
agregação: isso quebra consistência e auditabilidade.

### 4.4 Assinatura de empresa

1. Empresa autenticada consulta planos.
2. Endpoint de checkout autoriza a empresa via BillingPolicy.
3. Serviço cria/reusa Stripe customer e Checkout Session com preço do plano.
4. Browser abre URL do Stripe.
5. Stripe chama webhook assinado.
6. Handler valida assinatura, deduplica evento em Billing::StripeEvent e sincroniza
   Billing::CompanySubscription.
7. Feature access passa a refletir o plano/assinatura no backend.

O browser não é fonte de verdade do pagamento. Um retorno success na URL serve
para UX, não para ativação definitiva.

### 4.5 Chat e inbox

Chat de descoberta cria ChatSession e ChatMessage; serviços de IA roteiam
intenção, buscam conhecimento, montam contexto seguro, recomendam empresas ou
qualificam lead. Conversas P2P são outra entidade e possuem status open,
pending_user, pending_company, resolved ou blocked. O inbox empresarial observa
sessões e mensagens por ActionCable.

Dados de chat podem conter PII. Não envie transcript completo a analytics,
logs externos ou prompt de LLM sem filtro/necessidade. Preserve registro de
consentimento e sanidade do contexto de empresa.

## 5. Dados, cache e processamento

### 5.1 Fonte de cada dado

| Necessidade de tela | Fonte preferida |
| --- | --- |
| Perfil/listagem pública | API companies/categories com cache seguro do frontend e cache Rails/Redis quando aplicável. |
| Ranking, trust, reputação | Dados derivados/snapshots e serviços de dashboard, não cálculo no navegador. |
| Sessão | Auth API, JWT e contexto de company access. |
| Mensagem em tempo real | ActionCable, mais sincronização HTTP após reconexão. |
| Analytics de produto | Frontend analytics sanitizado, endpoint de eventos e agregação backend. |
| Arquivo/mídia | Active Storage/Spaces, URL proxy/pública configurada pelo backend. |

O frontend mantém cache de GET público em memória e deduplica requisições em
andamento. Isso não substitui invalidação server-side após mudar empresa, banner,
review ou categoria.

### 5.2 Camadas assíncronas

| Processo | Onde observar | Falhas comuns |
| --- | --- | --- |
| Envio de e-mail | Fila mailers, logs Rails/Brevo | Credencial SMTP, domínio, job morto, destinatário bloqueado. |
| Analytics | Fila analytics e tabelas de eventos/agregados | Evento fora de schema, duplicação, atraso, Redis indisponível. |
| Rating/trust/ranking | Sidekiq scheduler e snapshots | Agendamento ausente, dados inconsistentes, N+1/alto volume. |
| Notificação | Jobs e tabela notifications | Preferência do usuário, token push inválido, erro de provider. |
| Revalidação de perfil | Job e endpoint Next revalidate | Segredo divergente ou URL interna/pública errada. |
| Arquivo | Active Storage e Spaces | Credencial/bucket/CORS/host de URL. |
| Webhook de empresa | WebhookDeliveryJob | Endpoint destino lento, assinatura/retry, segredo. |

Sidekiq deve ser monitorado por latência, profundidade de fila, retries, dead
jobs e uso de Redis. Não limpe a dead queue antes de entender o erro recorrente.

### 5.3 E-mail

ActionMailer tenta SMTP Brevo quando usuário/senha existem; pode usar Brevo API
quando a chave correspondente existe; em desenvolvimento sem credenciais usa
test delivery. Em produção, credenciais ausentes devem gerar erro operacional.

Em staging/desenvolvimento, ative interceptor de e-mail quando fizer teste com
dados reais. Configure domínios seguros; isso evita disparo acidental para
clientes.

### 5.4 Arquivos e storage

| Ambiente | Storage esperado |
| --- | --- |
| Test | Disk em tmp/storage |
| Desenvolvimento | Disk em AB0-1-back/storage |
| Produção | Serviço spaces S3 compatível, configurado por credenciais e endpoint |

Depois de trocar storage, valide upload, URL no portal, exibição por Next Image,
download, variant/análise, permissão pública/proxy e remoção de anexo. Não faça
migração de bucket diretamente em produção sem cópia/rollback.

## 6. Limites, proteção e abuso

Rack::Attack possui os seguintes limites observados:

| Superfície | Limite |
| --- | --- |
| Eventos de banner por IP | 100/minuto e burst de 20/10 segundos |
| Eventos de banner por fingerprint | 30/minuto |
| MCP tools por IP | 120/minuto |
| Intent signals por IP | 120/minuto |
| Material downloads por IP | 12/minuto |
| Material downloads por e-mail hash | 5/10 minutos |
| Login por IP e por e-mail | 5/20 segundos |
| Forgot password por IP/e-mail | 5/10 minutos |
| Resend confirmation por IP/e-mail | 5/10 minutos |
| Trust API por IP | 60/minuto |
| Billing Stripe webhook por IP | 60/minuto |
| API geral por IP | 300/5 minutos |
| API autenticada por usuário | 1000/hora |
| GraphQL por IP | 60/minuto |
| GraphQL mutation crítica por IP | 10/minuto |
| GraphQL autenticado por usuário | 200/hora |

Localhost é safelisted e BLOCKED_IPS pode bloquear IPs por ambiente. O
throttled responder devolve 429 com campos de limite/reset e Retry-After.

Ao criar endpoint novo, determine antes:

1. se é leitura pública, mutação pública ou recurso autenticado;
2. se carrega PII, dinheiro, upload ou efeito externo;
3. o limite por IP, usuário, e-mail hash ou token adequado;
4. a necessidade de CAPTCHA/honeypot/idempotência;
5. como o cliente lida com 429 e retries.

## 7. Configuração por ambiente

### 7.1 Desenvolvimento

| Aspecto | Comportamento |
| --- | --- |
| Reload | Código recarregável e erros detalhados. |
| Cache | NullStore por padrão; MemoryStore se rails dev:cache está ativo. |
| Storage | Local. |
| Jobs | Sidekiq se Redis está habilitado e alcançável; async como fallback. |
| Cable | Adapter async. |
| URLs de arquivo | localhost:3001 por HTTP. |
| E-mail | Test delivery sem credenciais; MailCatcher no compose dev. |
| N+1 | Bullet habilitado após initialize. |

### 7.2 Produção

| Aspecto | Comportamento esperado |
| --- | --- |
| Cache | Redis cache store. |
| Jobs | Sidekiq. |
| Cable | Redis. |
| Storage | Spaces quando ACTIVE_STORAGE_SERVICE é spaces. |
| URL externa | HTTPS, APP_HOST/FRONTEND_ORIGIN/CORS/hosts corretos. |
| Worker | Serviço separado do backend web. |
| Observabilidade | Sentry, Scout/New Relic, métricas e logs estruturados. |

### 7.3 Variáveis que precisam concordar

| Lados | Invariante |
| --- | --- |
| Rails e Next | NEXT_REVALIDATE_SECRET idêntico; URL de revalidação alcançável. |
| Browser, Next SSR e API | URL pública, proxy e API interna sem duplicar /api/v1. |
| Rails/Redis/Sidekiq/Cable | REDIS_URL válida para cada container/rede. |
| Rails e storage | APP_HOST/ACTIVE_STORAGE_HOST e endpoint/bucket de Spaces corretos. |
| Stripe | Chave correta do modo, IDs de preço do plano, webhook secret e URLs públicas. |
| OAuth | Client IDs/secrets e callback URLs cadastradas para cada ambiente. |
| Analytics | Chaves públicas só no browser; chaves server-side só no backend/cofre. |

## 8. Operação de deploy

### 8.1 O que acontece no release web

1. Push em main aciona deploy-v1.
2. GitHub Actions faz checkout do SHA de release.
3. Backend e frontend são construídos com Docker Buildx.
4. Imagens são enviadas ao GHCR com tags latest e SHA.
5. Workflow conecta por SSH à produção.
6. Host atualiza checkout e usa compose/serviços para aplicar release.
7. Backend/worker/frontend passam por health checks.
8. Operador confirma URL pública, logs, jobs e integrações críticas.

O Dockerfile frontend exige secrets de build para chave de Server Actions e
Better Auth. O Dockerfile backend usa Rails master key no estágio de build.
Falha nessas variáveis deve interromper build, não cair em valor previsível.

### 8.2 Sequência segura para migration

1. Ler migration e dependências de código antigo/novo.
2. Tirar backup recuperável do banco.
3. Aplicar primeiro em staging e medir duração/lock.
4. Usar estratégia expandir-migrar-contrair para coluna/índice de alto risco.
5. Aplicar uma vez no release, antes de workers consumirem schema novo.
6. Validar db:migrate:status, logs e caminho afetado.
7. Só remover compatibilidade velha em release posterior.

Nunca execute reset, drop, schema:load ou down -v em banco/volume de produção.

### 8.3 Smoke test pós-deploy

| Teste | Critério |
| --- | --- |
| Frontend | Home retorna 200 e assets carregam sem violação CSP. |
| API | health/readiness e health/liveness retornam sucesso. |
| Dados | Migrações estão up e banco responde. |
| Auth | Login em conta de teste e logout funcionam. |
| Público | Busca, perfil e página de categoria abrem. |
| Conversão | Wizard inicia; não enviar lead real sem autorização. |
| Billing | Página de plano abre; usar Stripe test/sandbox para checkout. |
| Realtime | Cable realiza handshake 101 em ambiente habilitado. |
| Jobs | Worker online, filas sem crescimento anormal/dead jobs. |
| Observabilidade | Eventos/erros aparecem no ambiente correto. |

## 9. Runbooks de diagnóstico

### 9.1 API não sobe

~~~bash
cd AB0-1-back
make ps
make logs
make health
make migrate-status
~~~

Verifique nesta ordem: container db saudável, credenciais/host PostgreSQL,
Redis, migration pendente, Rails master key, variável de host/CORS e erro de
boot em log. Não altere schema para contornar migration pendente.

### 9.2 Portal abre, mas API falha

1. Abra endpoint /api/health do Next e /health da API diretamente.
2. Compare NEXT_PUBLIC_API_BASE_URL, API_PROXY_TARGET e API_URL_INTERNAL.
3. Confirme rewrite de /api/v1 e se não está formando /api/v1/api/v1.
4. Verifique CORS apenas para chamadas diretas; no proxy same-origin CORS não
   deveria ser necessário.
5. Confira Network, code de erro, Retry-After e logs Rails por request ID.

### 9.3 Erro de upload

1. Cheque tamanho e content type aceitos no modelo.
2. Valide client_max_body_size Nginx e limite do Next Server Actions.
3. Teste Active Storage local/Spaces com objeto pequeno.
4. Confira bucket, credencial, endpoint, CORS e URL gerada.
5. Verifique que o host público de Active Storage aponta a origem correta.

### 9.4 E-mail não chega

1. Veja a fila mailers e job retries.
2. Examine Rails log sem copiar destinatário/token para ticket.
3. Confirme provider, SMTP/API, domínio e remetente.
4. Em dev, abra MailCatcher e confirme interceptor.
5. Teste confirmação/reset com conta de teste e verifique throttle.

### 9.5 Dados de dashboard parecem errados

1. Identifique se a tela usa evento bruto, agregado ou snapshot.
2. Confira filtros de company_id e membership/empresa ativa.
3. Veja a latência de analytics e o último job de agregação.
4. Compare tabelas analytics_events, company_daily_stats e snapshots em cópia
   segura do banco.
5. Rode reconciliação/backfill apenas com janela e impacto aprovados.

### 9.6 Pagamento não ativa plano

1. Confirme se checkout realmente foi criado no modo Stripe esperado.
2. Verifique recebimento e assinatura do webhook.
3. Procure o evento em Billing::StripeEvent e o status de processamento.
4. Verifique CompanySubscription, plan e price ID.
5. Não edite subscription manualmente antes de identificar se webhook fará retry.
6. Para exceção financeira, siga aprovação humana e trilha de auditoria.

### 9.7 Git lento ou index.lock

No checkout atual em volume Windows, git status/diff excederam 30 segundos.
No computador novo, clone no filesystem Linux do WSL ou use Git Windows nativo
se isso persistir. Só remova index.lock após confirmar que nenhum Git real está
rodando; ele pode proteger commit, merge ou rebase válido.

## 10. Testes e critérios por mudança

| Mudança | Cobertura mínima |
| --- | --- |
| Controller/API | Spec de request, autorização, 401/403/422/429 e contrato JSON. |
| Modelo/regra | Spec de modelo para validação, callback e transição de estado. |
| Serviço | Spec unitária com sucesso, erro e idempotência. |
| Migration | Teste em banco limpo; plano de rollback e índice verificado. |
| Página Next | Typecheck, Jest do componente se existir, teste manual e rota SSR. |
| Fluxo crítico portal | Playwright e compose de teste quando impactar login, lead, perfil ou checkout. |
| Mobile | Jest, typecheck, lint, UI audit e Maestro para jornada afetada. |
| Webhook | Assinatura válida/inválida, duplicidade, payload inválido e provider timeout. |
| Analytics | Schema de evento, sanitização, consentimento e dedupe. |

O Playwright do frontend usa variável de base URL e o CI sobe o compose de teste.
O frontend também tem Jest, Cypress e configuração Lighthouse. Escolha a camada
mais barata que detecta a regressão, mas fluxos de pagamento/leads/realtime
exigem ao menos teste de integração/smoke.

## 11. Referência de documentação existente

| Tema | Arquivos úteis |
| --- | --- |
| Arquitetura ampla | docs/planning/AVALIA_SOLAR_DOCUMENTACAO_TECNICA_COMPLETA.md |
| Mobilidade/PWA | docs/architecture/MADR-001-mobile-platform.md, docs/MOBILE_DOCUMENTATION_INDEX.md |
| Analytics | docs/analytics/ANALYTICS_DOSSIER.md, EVENT_DICTIONARY.md e MEASUREMENT_READINESS_INDEX.md |
| Billing | docs/billing/BILLING_ARCHITECTURE.md, BILLING_OPERATIONS_RUNBOOK.md e BILLING_SECURITY_REVIEW.md |
| Segurança | SECURITY_AUDIT_INDEX.md, docs/security e WEBHOOK_SECURITY_GUIDE.md |
| SEO | docs/SEO_GEO_AEO_TECHNICAL_DISCOVERY_2026-07-14.md e docs/SEO_GEO_AEO_IMPLEMENTATION_TASKS_2026-07-14.md |
| Importação | docs/GUIA_IMPORTACAO_EMPRESAS_DATASET.md e docs/GUIA_SEED_MOBILIDADE.md |
| Dashboard | docs/architecture/TRUST_DASHBOARD_ARCHITECTURE.md, RealtimeDashboard.md e auditorias de dashboard |
| Hermes | hermes-agent/INDEX.md, PROCESS_INVENTORY.md e HUMAN_APPROVAL_MATRIX.md |
| Stories recentes | AB0-1-front/docs/stories e docs/stories |

## 12. Checklist de passagem técnica

- [ ] Pessoa sucessora leu Parte 1 e Parte 2.
- [ ] Commit de trabalho e estado de cada branch foram registrados.
- [ ] Segredos foram transferidos por cofre e acessos pessoais revisados.
- [ ] Backup de PostgreSQL foi restaurado ao menos uma vez em ambiente seguro.
- [ ] API, portal e mobile foram iniciados no novo computador.
- [ ] Health, login, busca, perfil e uma rota de dashboard foram testados.
- [ ] Migrations de todos os ambientes foram conferidas.
- [ ] Webhook Stripe, upload Spaces, e-mail e Cable foram testados em staging.
- [ ] CI e alertas de observabilidade são acessíveis pela nova pessoa.
- [ ] Pendências P0/P1 da Parte 1 têm responsável e prazo.
- [ ] Este arquivo foi atualizado com data, commit e decisões posteriores.

---

A continuidade segura do Avalia Solar depende mais de preservação de contratos
entre API, dados, planos e integrações do que de velocidade para alterar telas.
Em dúvida, pare a mudança externa, reproduza em staging, valide autorização e
mantenha trilha de auditoria.

