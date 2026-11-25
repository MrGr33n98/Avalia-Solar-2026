# MCP UI Catalog — evolução incremental A+++
Status: implementação parcial Wave 1; gates ainda não verificados. Base: Specs 018, 020 e 021. Não duplicar o registry nem alterar o contrato público v1 sem revisão.
## Referências
- https://developers.openai.com/plugins/concepts/ui-guidelines
- https://developers.openai.com/plugins/build/chatgpt-ui
- https://developers.openai.com/plugins/build/app-quickstart
- https://www.mcpcn.dev/docs/mcp
- specs/021-agent-native-ui-registry/MCPCN_SCAN.md e IMPLEMENTATION_STATUS.md
## 20 componentes / backlog
| ID | Bloco | Dados/ação | Dependência / aceite |
|---|---|---|---|
| 01 | Company Card | list_integrators | existente; ações reais, ID estável, nota nula |
| 02 | Brand Page | show_integrator_profile | existente; previews por flag, tabs e links validados |
| 03 | Company Carousel | list_integrators | adaptar SolarCompanyList; scroll snap sem autoplay, teclado |
| 04 | Category Explorer | list_solar_categories | existente; cursor, hierarquia e estados de erro |
| 05 | Smart Filters | list_integrators | cidade/UF/categoria/ordenação; preservar escopo, cursor vinculado ao filtro |
| 06 | Compare Companies | compare_integrators | existente; 2–3 IDs únicos, 320px legível, sem vencedor |
| 07 | Reputation Dashboard | get_integrator_reputation | existente; distribuição real, amostra, sem avaliações ≠ zero |
| 08 | Coverage Map | declared_coverage | Wave 1 detalhes textuais; mapa futuro com SVG licenciado UF, sem pinos inferidos |
| 09 | Product Showcase | catalog_preview | existente condicional; ampliar com paginação e produto público |
| 10 | Product Comparator | nova consulta tipada | modelos e unidades normalizadas, campos desconhecidos explícitos |
| 11 | Review Highlights | nova consulta pública | somente aprovadas, texto sanitizado e anonimizado, sem citação sintética |
| 12 | Achievement Showcase | trust_preview | existente condicional; selo, emissor, evidência, vigência |
| 13 | Quote Request | nova mutação autenticada | autorização por plano, preview e confirmação, idempotência, LGPD |
| 14 | Solar Calculator | cálculo puro versionado | consumo, tarifa, irradiação, perdas; premissas e intervalo, sem promessa |
| 15 | Financing Simulator | cálculo puro versionado | principal, taxa, prazo, CET conhecido/ausente; sem oferta fictícia |
| 16 | Favorites | estado local / futura conta | distinguir persistência de sessão e autenticada; desfazer |
| 17 | Newsletter | nova mutação autenticada ou consentida | opt-in explícito, double opt-in, descadastro, sem disparo implícito |
| 18 | Market Intelligence | agregados novos | fonte, data, unidade, metodologia e coorte; sem números inventados |
| 19 | Trust Score | contrato/metodologia a aprovar | não confundir verificação com qualidade; pesos publicados, insuficiência de amostra |
| 20 | Recommendations | busca/comparação + explicação | filtros explícitos, patrocínio identificado, sem vencedor ou garantia |
## DDD e arquitetura
Contexts Directory, Reputation, Catalog, Coverage, SolarSimulation, Financing, Engagement, MarketIntelligence. Rails é fonte de verdade; policies e application services controlam casos de uso; adapters MCP serializam DTOs versionados. Zod valida no frontend e JSON Schema no backend. Widgets orquestram; blocks recebem data/actions/appearance/control; primitives e tokens são compartilhados. Reutilizar HostProvider; MCP Apps ext-apps como bridge principal, window.openai só compatibilidade. Sem conexão direta de widget ao banco ou API privada. Não registrar tools de mutação na allowlist pública read-only. Cada domínio novo requer ADR, testes negativos, autorização e flag default OFF. Registrar URI versionada e MIME text/html;profile=mcp-app apenas após build. Manter fallback textual e CSP restritiva.
## UI/UX
Host-first, tokens existentes e acento Avalia Solar em conteúdo, sem duplicar chrome/branding do host. 4px base, espaçamento 8/12/16/24, título 16–20, corpo 14, metadata 12–13, contraste WCAG AA. Conteúdo curto inline; fullscreen para comparação complexa, mapa e simuladores. Alvos interativos >=44px quando possível, foco visível, leitor de tela, aria-live para atualizações, reduced-motion, dark/light, 320/390/480/768/1024px e zoom 200%. Sem autoplay ou carregamento desnecessário. Loading/skeleton, vazio, erro/retry, offline, stale e permissões em cada fluxo. Usar valores reais ou identificar demo explicitamente.
## Performance e segurança
Spec 021 reporta categories 122748/122880 B gzip (132 B livres), search 592 B livres; não elevar budget. Primeiro medir dependências/ext-apps/Zod e explorar entry mais leve com testes de compatibilidade; superfícies novas independentes, não importar todo registry. Meta proposta por superfície <=120 KiB gzip, payload <=64 KiB, perfil opcional <=32 KiB, interação local p95 <100ms, INP <=200ms em harness controlado, tool p95 <=600ms em staging (medir cold/warm separadamente), sem regressão >10% baseline; não são resultados. Imagens com dimensões, lazy load fora da primeira dobra, nenhum segredo ou fixture no bundle, CSP allowlist, sem HTML não sanitizado. Reduzir queries com preload e semi-join; EXPLAIN em staging sem dados privados. Telemetria agregada sem email, telefone, prompts ou dados financeiros. Não adicionar processo à VM.
## TDD e gates
1. Baseline main SHA, npm ci, npm run verify, npm run test:e2e; RSpec MCP isolado; capturar gzip e screenshots.
2. RED testes de contratos/DDD, GREEN implementação mínima, refactor com budget. Wave 1 commits incluem testes antes dos fixes, mas RED/GREEN ainda não executado.
3. Unit + request specs, fixtures sintéticas somente no harness, mocks de host e E2E Playwright em 2 temas, teclado e axe; teste race/debounce, cursor, erros, IDs nulos, autorização, CSP e rollback.
4. CI em paralelo para lint/typecheck/unit, Rails specs, build budget e Playwright; não afrouxar gates; evidência por SHA. Integrar E2E mcp-ui ao CI existente após inspeção.
5. Staging: resources/list/read, tools/list/call, fallback, flags OFF/ON e refresh do plugin; testar host real ChatGPT e pelo menos um host MCP Apps compatível. Registrar vídeo/screenshot e IDs de request sem PII.
6. Produção somente após todos gates verdes, aprovação, canary por superfície, observabilidade e rollback para flags OFF/imagem anterior. Não marcar ready antes disso.
## Wave 1 entregue nesta branch
- Regressão de cidade preservada com UF/ordenação e fix no widget.
- Regressão de cidade + categoria no Rails e semi-join para evitar DISTINCT em colunas JSON (hipótese para erro de busca; confirmação em staging pendente).
- DeclaredCoverage acessível, integrado ao perfil standalone, sem mapa fictício.
- Não foram executados CI, RSpec ou host real nesta sessão até a criação deste documento; verificar PR.
## Waves seguintes
W2: orçamento de bundle e testes de host; filtros completos, cursor/estado inicial e carrossel. W3: catálogo, comparação técnica, reviews, achievements, mapa. W4: simuladores com fórmulas validadas. W5: orçamento, favoritos persistentes, newsletter com consentimento. W6: metodologia Trust Score, inteligência e recomendações auditáveis. W7: staging, canary e release. Cada wave PR independente, rollback e critérios acima.


## Execução adicional W2–W7 (PR #245)
- CI da Wave 1: falha TS6133 (import React não usado) e categories 122885 B > 122880 B; corrigidos import e textos compartilhados, orçamento preservado. Necessário verificar novo SHA.
- W2: carrossel navegável local no registry/playground; não conectado à busca real. Filtros cidade parcialmente corrigidos; debounce/cursor e ganho de bundle ainda pendentes de validação.
- W3: comparação de metadados do catálogo (não especificações técnicas), grade de cobertura por UF (não mapa geográfico), highlights filtrados por aprovado (sem endpoint). Product Showcase e Achievements permanecem previews condicionais.
- W4: simuladores puros e formulários interativos no playground, sem oferta financeira ou dados de irradiação geográfica. Testes de fórmula e limites escritos.
- W5: favoritos em estado local, rascunho de orçamento sem envio, newsletter com prévia de consentimento sem coleta. Persistência e mutações autenticadas não implementadas.
- W6: indicadores da seleção carregada, evidências de cadastro sem score numérico e recomendações por categoria sem ranking. Não são inteligência de mercado nacional nem Trust Score oficial.
- W7: registry e playground estendidos com 12 blocos; matriz Playwright/axe em 17 blocos × 2 temas × 8 larguras; novo job de browser paralelo aos contratos Rails. Execução e aprovação ainda pendentes.
- Todas as novas prévias estão isoladas do build de produção, com fixtures explícitas; nenhum novo tool MCP publicado. Não habilitar flags, merge ou deploy até CI verde, análise de segurança e teste real do host. Os blocos não representam a implementação integral das waves.
