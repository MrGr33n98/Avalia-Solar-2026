# Contrato de eventos de atribuição de empresas — v1

Status: implementado no MVP defensável. Versão: tracking-attribution-v1.

## Objetivo

Uniformizar eventos usados pelo workspace Tracking & Atribuição sem criar uma segunda pipeline. A ingestão canônica continua em Analytics::TrackEventService e a leitura continua em Analytics::AttributionQuery.

## Fronteira de tenant

Todo evento reportável de empresa deve carregar company_id. O endpoint do workspace resolve a empresa pelo escopo autenticado e consulta AnalyticsEvent.where(company_id: empresa.id, tracked_at: período). Eventos de outra empresa nunca entram na resposta.

## Campos canônicos

| Campo | Obrigatório | Regra |
| --- | --- | --- |
| company_id | sim | Identificador interno da empresa; nunca confiar apenas no frontend. |
| event_type | sim | profile_view, cta_click ou lead_created após canonicalização. |
| event_id | sim na ingestão | Chave idempotente; TrackEventService mantém deduplicação existente. |
| tracked_at | sim | Momento do evento; consultas respeitam período solicitado. |
| metadata.session_id ou anonymous_id | recomendado | Chave de jornada sem PII direta. |
| metadata.utm_* | quando houver campanha | UTM de entrada normalizada; sem e-mail, telefone ou nome. |
| metadata.surface | recomendado | Superfície da exposição/click. |
| metadata.placement | recomendado | Slot semântico da superfície. |
| metadata.position | recomendado | Posição ordinal quando aplicável. |
| metadata.sponsored | recomendado | Separação orgânico/patrocinado. |
| metadata.page_path | recomendado | Caminho interno sem query sensível. |
| metadata.impression_id | recomendado | Identificador de impressão. |
| metadata.click_id | recomendado em click | Identificador de click; não usar timestamp como dedupe. |

Aliases legados são canonicalizados por Analytics::EventTaxonomy. O workspace exibe apenas canais, campanhas e conversões calculados pela pipeline existente.

## Idempotência de click

A ingestão server-side reutiliza o dedupe existente por event_id. BannerEvent possui as restrições existentes para click_instance_id e event_key.

click_id é correlação estável, mas não substitui sozinho a chave de idempotência de AnalyticsEvent. Para garantir que retry do mesmo click não conte novamente, o produtor deve reenviar o mesmo event_id (ou uma chave estável já coberta por uma restrição existente); gerar novo event_id em retry não é seguro. Isso não bloqueia dois clicks reais de uma mesma sessão.

## First Touch e Last Touch

- First Touch: primeiro evento elegível da jornada antes da ação analisada.
- Last Touch: último evento elegível da jornada até a ação analisada.
- Jornada usa, nesta ordem, lead_id, session_id, anonymous_id ou user_id.
- Eventos posteriores à ação não podem influenciar sua atribuição.
- Direct é classificação própria. Unknown é ausência de evidência suficiente; não converter Unknown em Direct.

O workspace permite alternar o modelo. Quando não há evidência explícita nem jornada identificável, a saúde do componente permanece em atenção; a UI não promete cobertura que não foi observada.

## UTM

UTM de entrada é editável no gerador: utm_source, utm_medium, utm_campaign, utm_content e utm_term. Valores são normalizados e não devem conter PII.

Links de saída da plataforma usam:

- orgânico: utm_source=avaliasolar;
- mídia patrocinada: utm_source=avaliasolar_ads;
- utm_medium: definido pela superfície;
- click_id: opcional, mas recomendado para atribuição interna.

A origem de saída não pode ser sobrescrita pelo query string do destino.

## Estados de disponibilidade

O contrato diferencia ready, empty, unavailable, processing e error. Saúde usa healthy, attention, unavailable, not_configured, processing e error. Zero é valor válido quando a fonte foi consultada e não houve ocorrência; indisponível nunca é serializado como zero.

## Privacidade

Não persistir PII em UTM, click_id, session_id ou metadata. O identificador de jornada deve ser anônimo ou pseudonimizado. Exportação CSV inclui somente agregados de canal/campanha e passa por escape contra formula injection.
