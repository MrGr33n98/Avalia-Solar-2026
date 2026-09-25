# Runbook — tracking e attribution

## Estado atual

Requests internos de tracking exigem autenticação. O tracking web público usa `Sales::TrackingSite` com chave opaca por tenant e origens HTTPS exatas. O endpoint resolve tenant pela chave, valida origem, cria session/anonymous IDs no servidor e aceita apenas eventos web allowlisted com UUID idempotente. O browser não escolhe account/contact IDs.

A tela `dashboard/sales/settings/tracking` cria a configuração, salva origens, mostra o snippet servido pelo backend e permite rotacionar a chave. Request specs cobrem ingestão, dedupe, origem, CORS e identity autenticada para Contact. O snippet ainda não foi executado em browser real/staging. Rack::Attack limita por IP e chave, mas usa `MemoryStore`; em produção o limite é por processo e precisa de quota compartilhada entre réplicas.

## Para reabrir tracking público

Antes de produção, configurar as origens oficiais via UI, validar CSP/preflight no domínio real, conectar o pixel à preferência/consentimento de tracking do site quando aplicável e usar rate limit compartilhado. A associação autenticada resolve sessão para Contact; submissão→Lead e conversão para Opportunity ainda não estão implementadas. Não aceitar `company_id`, `account_id`, `contact_id` ou email como autorização/identidade arbitrária.

UTM/referrer/path não devem carregar PII. O collector remove query da landing path, persiste apenas host do referrer, filtra propriedades com chaves PII e classifica hosts internos conhecidos como `internal`; a attribution mantém a contagem interna separada. Valores UTM continuam dependendo da convenção do site integrador — não inclua dados pessoais.

## Attribution

A rota existente `GET /sales/attribution` agrupa sessões por source/medium/campaign e separa contagem interna. First/last touch persistente e vínculo até Lead/Contact/Opportunity/Won ainda não existem; a métrica atual conta sessões, não conversões atribuídas.

Request specs exercitam sessão anônima→evento→identity autenticada→Contact. Nenhuma ingestão→conversão→attribution E2E foi executada.
