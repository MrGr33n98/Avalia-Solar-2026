# PRD — Vitrine do Integrador (Agentic Storefront) v1 "100% funcional"

**Spec:** 026 · **Versão:** 1.0 · **Data:** 27/11/2026 · **Status:** proposta para aprovação
**Escopo:** levar a vitrine pública (`/storefront/[slug]`), a API `GET /api/v1/storefronts/:slug` e a ferramenta MCP `show_storefront_profile` de "existe em produção" para "funciona de ponta a ponta, gera lead mensurável e se sustenta comercialmente".

> Este PRD complementa `spec.md`, `plan.md`, `tasks.md` e `data-model.md`. Ele não substitui esses documentos.
> Tudo em **Estado atual** foi verificado no código da `origin/main` (`fc0e25f92` + #254) e em GETs públicos de produção em 27/11/2026. O que não foi verificado aparece como **não verificado**.

---

## 1. Problema

O integrador solar já cadastra projetos, produtos e serviços no dashboard (Spec 022). Esse esforço não vira demanda por dois motivos:
1. O perfil público (`/companies/[id]`) não funciona como "vitrine comercial", porque não tem portfólio estruturado, simulador nem CTA de orçamento próprio.
2. Assistentes de IA (ChatGPT, Claude) já são porta de entrada de pesquisa, e hoje não existe uma forma confiável de o integrador aparecer **dentro** da conversa com os próprios dados.

A Spec 026 entregou as peças (serviço, API, rota web, widget MCP), mas elas **não estão ligadas entre si nem ao negócio**.

## 2. Estado atual (verificado)

| Peça | Situação | Evidência |
|---|---|---|
| API `GET /api/v1/storefronts/:slug` | ✅ responde 200, pública, cache de 5 min | `storefronts_controller.rb`; GET em `volvo-recharge` |
| Página `/storefront/[slug]` | ✅ responde 200, ISR de 30 min, JSON-LD `LocalBusiness` | `app/storefront/[slug]/page.tsx` |
| Ferramenta MCP `show_storefront_profile` | 🔴 **quebra ao ser executada** | `executor.rb` chama `PublicProfileService.new(company)`, mas o serviço só aceita `initialize(slug:)` → `ArgumentError` |
| Widget MCP `storefront.v1.html` | ✅ build existe em `AB0-1-back/public/mcp-ui/` | `resource_registry.rb` |
| Projetos na vitrine | 🔴 **sempre vazio** | o serviço usa `company.projects`; o model tem `company_projects` (com `published`, `capacity_value`, `capacity_unit`) |
| Produtos na vitrine | 🟡 funciona, mas sem curadoria | `company.products.limit(10)` |
| Headline, CTA, marcas | 🟡 fixos no código | `build_settings` |
| CTA "Solicitar Orçamento" | 🟠 só leva para `/companies/[slug]`, sem captura de lead na vitrine | `StorefrontClient.tsx` |
| Simulador | 🟠 fórmula fixa (`conta ÷ 95` kWp; economia = 90% da conta), sem premissas exibidas | `StorefrontClient.tsx:66-67`, `StorefrontWidget.tsx` |
| Respeito ao plano | 🔴 ignora o entitlement `projects_showcase` (falso no plano `essential`, verdadeiro em `pro`/`enterprise`) | `plan_feature_catalog.rb` |
| Descoberta | 🔴 nenhuma página linka para `/storefront/*`, e a rota não está no sitemap | grep no front e `sitemap-index.xml` |
| Canonical | 🟠 aponta para `/storefront/slug`, concorrendo com `/companies/slug` (conteúdo duplicado) | `page.tsx` |
| Dashboard | 🔴 não existe a aba "Minha Vitrine" (T17–T20 abertos) | `tasks.md` |
| Telemetria IA | 🔴 `ai_agent_type` **não existe no código**, embora o TASKLIST GA4 marque T-P2-02 como concluído | `git grep ai_agent_type` → 0 ocorrências |
| Testes da ferramenta | 🔴 o spec MCP valida registro e schema, mas nunca executa a ferramenta | `storefront_tool_spec.rb` |
| Flags em produção | ❓ **não verificado** se `MCP_PUBLIC_STOREFRONT_ENABLED` / `MCP_UI_STOREFRONT_ENABLED` estão ligadas | vêm do `.env` do servidor |

**Divergência entre documentação e código:** o `tasks.md` marca T03 (cenários Free/Pro), T14 (`QuoteDraft` e calculadora integrados) e T15 como feitos, e o `IMPLEMENTATION_STATUS.md` marca G08 como concluído. O código não confirma T03 nem T14. O `data-model.md` descreve um `StorefrontSetting` e um `CompanyProduct` que **não existem** no schema.

## 3. Objetivos e metas

### 3.1 Objetivos
- **O1, funcionar:** os três canais (web, API e IA) entregam os mesmos dados reais da empresa, sem erro.
- **O2, converter:** toda visita à vitrine tem um caminho de um clique até um lead atribuído à empresa e ao canal.
- **O3, provar valor:** o integrador vê no dashboard quantas visitas e leads a vitrine gerou, incluindo os vindos de IA.
- **O4, monetizar com defesa:** o que é exclusivo do plano pago fica de fato restrito, e tudo o que a vitrine afirma é rastreável a um dado verificável.

### 3.2 Metas
As metas técnicas valem como critério de aceite. As de negócio exigem **baseline nos primeiros 30 dias**: os números abaixo são propostas a validar com Produto, não dados históricos.

| Meta | Indicador | Alvo | Como medir |
|---|---|---|---|
| M1 | Taxa de erro da `show_storefront_profile` | 0% de 5xx em 7 dias após o release | logs do `/mcp` + Sentry |
| M2 | Paridade de dados entre web, API e MCP | 100% dos campos iguais para o mesmo slug | teste de contrato automatizado |
| M3 | Latência da API | p95 ≤ 150 ms (meta da `spec.md`) | APM (New Relic/Scout) |
| M4 | Bundle do widget | ≤ 120 KiB gzip (meta da `spec.md`) | `packages/mcp-ui` build |
| M5 | Vitrines "não vazias" (≥ 1 projeto **ou** ≥ 1 produto) entre as empresas pagantes | proposta: ≥ 60% em 60 dias | consulta agregada |
| M6 | Conversão visita → lead na vitrine | baseline em 30 dias; meta = baseline do `/companies/[id]` + X p.p. (Produto define X) | GA4 key event `generate_lead` com `source=storefront` |
| M7 | Leads atribuídos a IA | 100% dos leads vindos da IA com `utm_source`/`ai_agent_type` preenchidos | colunas `utm_*` de `leads` + dimensão GA4 |
| M8 | Upsell | proposta: ≥ N empresas `essential` → `pro` citando a vitrine em 90 dias (Comercial define N) | billing + motivo do upgrade |
| M9 | Rich Results | 0 erros no teste do Google nas páginas de vitrine | Search Console |

## 4. Personas

| Persona | Quem é | O que quer |
|---|---|---|
| **P1 Integrador** (dono ou gestor da empresa) | Cliente B2B pagante ou potencial | Mostrar o portfólio, receber orçamentos qualificados e saber de onde vieram |
| **P2 Consumidor** (residencial ou PME) | Pesquisa antes de contratar | Confiar na empresa, entender quanto vai economizar e pedir orçamento sem spam |
| **P3 Agente de IA** (ChatGPT/Claude via MCP) | Intermediário | Dados estruturados, confiáveis e com limitações explícitas para recomendar |
| **P4 Comercial Avalia Solar** | Time interno | Um argumento de venda do plano Pro sustentado por números |
| **P5 Admin/Moderação** | Time interno | Garantir que nada publicado seja falso ou viole a LGPD |

## 5. User stories e critérios de aceite

### Épico E1: a vitrine funciona (P0)
- **US-01 (P3)** Como agente de IA, quero chamar `show_storefront_profile` com `slug` ou `company_id` e receber a vitrine, para exibi-la no chat.
  - **Dado** uma empresa ativa `volvo-recharge`, **quando** chamo `tools/call` com `{slug:"volvo-recharge"}`, **então** recebo `isError:false`, `structuredContent` válido pelo `outputSchema` e `_meta.ui.resourceUri` (se as flags de UI estiverem ligadas).
  - **Dado** um slug inexistente ou inativo, **então** recebo o erro JSON-RPC `-32602` ("Public company not found"), nunca 500.
  - Um teste RSpec **executa** a ferramenta (não só o registro).
- **US-02 (P2)** Como consumidor, quero ver na vitrine os projetos que a empresa publicou, para avaliar a experiência dela.
  - Mostra só `company_projects.published.ordered`, no máximo 6, com `capacity_value` + `capacity_unit`, cidade/UF e ano.
  - Rascunho, projeto moderado ou não publicado **nunca** aparece.
- **US-03 (P1)** Como integrador, quero que web, API e IA mostrem exatamente os mesmos dados.
  - Um teste de contrato compara o JSON da API com o `structuredContent` da MCP para o mesmo slug.

### Épico E2: converter (P0)
- **US-04 (P2)** Como consumidor, quero pedir orçamento direto na vitrine, sem ser jogado para outra página.
  - O formulário pede nome, contato (telefone ou e-mail), cidade/UF, valor da conta e consentimento LGPD explícito (não pré-marcado).
  - Cria um `Lead` com `company_id` da vitrine, `source = storefront` e `utm_*` da sessão. Reaproveita o fluxo de lead existente; não cria um modelo novo.
  - Rate limit (Rack::Attack) e proteção anti-spam.
  - Confirmação na tela e evento `generate_lead` no GA4 (com consentimento).
- **US-05 (P2/P3)** Como consumidor vindo de uma IA, quero que o CTA do widget abra a vitrine já identificando a origem.
  - O CTA usa `openExternalUrl` para `/storefront/slug?utm_source=<chatgpt|claude|…>&utm_medium=ai_agent&utm_campaign=storefront_mcp`.
  - O lead resultante fica com `utm_source` preenchido, e o GA4 recebe `ai_agent_type`.
- **US-06 (P2)** Como consumidor, quero uma simulação honesta.
  - Mostra as premissas: tarifa usada, geração média por kWp na UF e efeito da Lei 14.300 (compensação do fio B).
  - Rótulo "estimativa, não é proposta". Nenhuma promessa de economia exata.
  - As premissas ficam centralizadas num único lugar, compartilhado entre web e widget.

### Épico E3: gestão no dashboard (P1)
- **US-07 (P1)** Como integrador, quero uma aba "Minha Vitrine" no dashboard para pré-visualizar a vitrine, copiar o link e ver o status do que está publicado.
  - Mostra "Ver vitrine" (link), a contagem de projetos e produtos publicados e avisos do tipo "sua vitrine está vazia: publique um projeto".
  - Usa os cadastros que já existem (projetos em `ProjectsMaterialsHub`, produtos, serviços). Não duplica formulários.
- **US-08 (P1)** Como integrador Pro, quero personalizar o headline, o texto do CTA e as marcas em destaque.
  - Pundit (`StorefrontPolicy`): só membros da empresa ativa editam.
  - Precisa de persistência. Decidir entre nova tabela `storefront_settings` (o `data-model.md` propõe) ou campos em tabela existente. **Exige aprovação de schema.**
- **US-09 (P1)** Como integrador, quero ver visitas, cliques no CTA e leads da vitrine, separados por origem (web orgânico, IA, direto).
  - Os números vêm de dados reais (GA4/eventos internos/`leads`). **Nunca métricas fictícias.** Sem dados, mostra o estado vazio.

### Épico E4: monetização e confiança (P0/P1)
- **US-10 (P4)** Como Comercial, quero que o portfólio de projetos na vitrine respeite o entitlement `projects_showcase`.
  - Plano `essential`: a vitrine mostra o cabeçalho, as avaliações e os produtos, e no lugar dos projetos aparece um teaser bloqueado para o dono (no dashboard), nunca para o consumidor.
  - Planos `pro`/`enterprise`: o portfólio completo aparece.
  - A regra vale **no backend** (API e MCP), não só no front.
- **US-11 (P5)** Como moderação, quero que o selo "verificada" e a nota mostrados sejam os mesmos do perfil oficial e que o JSON-LD só traga `AggregateRating` quando houver avaliações reais.
  - Já é assim no JSON-LD (`review_count > 0`). Manter com teste.
- **US-12 (P3)** Como agente de IA, quero `limitations` e `data_as_of` corretos, para não afirmar o que a plataforma não garante.

### Épico E5: descoberta (P1)
- **US-13 (P2)** Como consumidor no perfil `/companies/[id]`, quero um link "Abrir vitrine".
- **US-14 (SEO)** Como mecanismo de busca, preciso de uma canonical sem duplicidade.
  - **Decisão pendente D2:** (a) a vitrine é a página canônica comercial e o perfil aponta para ela, ou (b) a vitrine é `noindex` ou canonicaliza para `/companies/slug`.
  - Se (a), incluir `/storefront/*` das empresas ativas e com conteúdo no sitemap.

## 6. Requisitos

### 6.1 Funcionais
| ID | Requisito | US |
|---|---|---|
| RF-01 | O executor MCP chama o serviço com a assinatura correta e reaproveita a mesma busca da API (`status: 'active'`) | US-01 |
| RF-02 | O serviço lê `company_projects.published.ordered.limit(6)`, mapeando `capacity_value`/`capacity_unit` | US-02 |
| RF-03 | O serviço aplica o entitlement `projects_showcase` | US-10 |
| RF-04 | Formulário de orçamento na vitrine criando `Lead` com `source` e `utm_*` | US-04 |
| RF-05 | CTA do widget com UTM de agente | US-05 |
| RF-06 | Premissas do simulador centralizadas e exibidas | US-06 |
| RF-07 | Aba "Minha Vitrine" no dashboard | US-07 |
| RF-08 | Configuração da vitrine (Pro), com Pundit | US-08 |
| RF-09 | Métricas da vitrine no dashboard | US-09 |
| RF-10 | Link a partir do perfil, mais sitemap e canonical conforme D2 | US-13/14 |
| RF-11 | Dimensão `ai_agent_type` enviada ao GA4 de fato (corrigir o TASKLIST) | US-05, M7 |

### 6.2 Não funcionais
| ID | Requisito |
|---|---|
| RNF-01 | API p95 ≤ 150 ms; sem N+1 (`includes` nos projetos e produtos; Bullet limpo) |
| RNF-02 | Widget ≤ 120 KiB gzip; CSP estrita |
| RNF-03 | LGPD: nenhum PII no payload público; consentimento explícito no formulário; retenção do lead conforme a política existente |
| RNF-04 | Rate limit na API pública e no formulário |
| RNF-05 | Feature flags com desligamento imediato (`MCP_PUBLIC_STOREFRONT_ENABLED`, `MCP_UI_STOREFRONT_ENABLED` e uma flag nova para o formulário) |
| RNF-06 | Acessibilidade: abas e formulário navegáveis por teclado; contraste AA |
| RNF-07 | Mobile-first (320–430 px), sem rolagem horizontal |

## 7. Gaps para "100% funcional e defensável"

### 7.1 Técnicos (bloqueiam o "funcional")
| # | Gap | Severidade | Esforço estimado |
|---|---|---|---|
| G1 | Executor MCP chama o serviço com a assinatura errada | 🔴 P0 | P (horas) |
| G2 | Projetos nunca aparecem (`projects` × `company_projects`) | 🔴 P0 | P |
| G3 | Sem teste que execute a ferramenta, nem de paridade web/API/MCP | 🔴 P0 | P |
| G4 | Busca duplicada e inconsistente (`active?` × `status: 'active'`) | 🟡 | P |
| G5 | Contrato Zod frouxo (`state` sem tamanho; `photo_urls` sem limite) × `data-model.md` | 🟡 | P |
| G6 | Flags de produção não verificadas | ❓ | P (checar `.env`) |

### 7.2 De produto (bloqueiam o "gera valor")
| # | Gap | Severidade |
|---|---|---|
| G7 | Sem captura de lead na vitrine; o CTA só redireciona | 🔴 P0 |
| G8 | Nenhum caminho até a vitrine (perfil, dashboard, sitemap) | 🔴 P0 |
| G9 | Settings fixos; o integrador não personaliza nada | 🟠 P1 |
| G10 | Sem métricas para o integrador | 🟠 P1 |
| G11 | Fotos dos projetos: não verificado de onde vêm (`company_projects` não tem coluna de foto) | 🟠 P1 |

### 7.3 Comerciais e de defesa (bloqueiam o "defensável")
| # | Gap | Por que importa |
|---|---|---|
| G12 | Entitlement `projects_showcase` ignorado | Entrega de graça o que o plano Pro vende. Quebra o argumento de upsell e cria passivo com quem já pagou |
| G13 | Simulador com fórmula fixa e economia de 90% sem premissas | Estimativa sem premissa pode ser contestada como propaganda enganosa (CDC) e ignora a Lei 14.300. Risco de reputação para a plataforma e para o integrador |
| G14 | Atribuição de IA inexistente (`ai_agent_type` ausente) | Sem prova de "leads vindos do ChatGPT", o diferencial "agent-native" é só um argumento, não um número |
| G15 | Canonical duplicada vitrine × perfil | Divide a autoridade de SEO da própria empresa |
| G16 | Documentação diz que está feito o que não está (T03, T14, G08, T-P2-02) | Risco de decisão errada e de auditoria; mina a confiança no processo |
| G17 | Sem termos de uso dos dados da vitrine por agentes de terceiros | Define o que a IA pode afirmar; `limitations` precisa refletir isso |

### 7.4 O que torna a vitrine defensável (fosso competitivo)
1. **Dado verificado, não autodeclarado:** nota, selo e projetos passam por moderação (`moderation_reason`, `published`). Concorrentes de diretório genérico não têm isso.
2. **Prova de origem:** cada lead carrega canal e agente, e o integrador vê isso no dashboard. Esse é o argumento central de venda do Pro.
3. **Presença agent-native com contrato estável:** `schema_version`, `data_as_of` e `limitations` fazem do Avalia Solar uma fonte citável por IAs.
4. **Honestidade do simulador:** premissas explícitas protegem juridicamente e aumentam a confiança.
5. **Gating real no backend:** o valor do plano não vaza pela API nem pela MCP.

## 8. Plano de entrega

| Fase | Conteúdo | Gaps/US | Critério de saída |
|---|---|---|---|
| **F0, consertar** (P0, ~1–2 dias) | G1–G5 + testes que executam a ferramenta + paridade | US-01/02/03 | CI verde; `tools/call` real em staging ou local retorna a vitrine com projetos |
| **F1, defender** (P0) | G12 (entitlement), G13 (premissas do simulador), G16 (corrigir docs) | US-06/10/11/12 | Teste de plano `essential` × `pro`; simulador com premissas revisadas por Produto |
| **F2, converter** (P0) | G7, G14 (formulário + UTM + `ai_agent_type`) | US-04/05 | Lead criado com `source`/`utm_*`; evento no GA4 DebugView |
| **F3, descoberta** (P1) | G8, G15 (perfil → vitrine, canonical, sitemap) | US-13/14 | Decisão D2 tomada; Rich Results sem erro |
| **F4, gestão** (P1) | G9–G11 (aba Minha Vitrine, settings Pro, métricas) | US-07/08/09 | E2E do dono da empresa; Pundit testado com tenants A/B |
| **F5, medir** | Baseline de 30 dias e revisão das metas M5–M8 | — | Relatório com números reais |

## 9. Definition of Done ("100% funcional")
- [ ] Os três canais retornam os mesmos dados reais para qualquer empresa ativa (teste de paridade).
- [ ] Nenhum 5xx na ferramenta MCP; erros mapeados para códigos JSON-RPC.
- [ ] Projetos publicados aparecem; rascunhos e moderados nunca aparecem.
- [ ] Entitlement respeitado no backend.
- [ ] Simulador com premissas visíveis e rótulo de estimativa.
- [ ] Lead criado a partir da vitrine (web e IA) com origem rastreável, visível no dashboard.
- [ ] Caminho para a vitrine a partir do perfil e do dashboard; canonical sem duplicidade.
- [ ] RSpec, Jest e Playwright (desktop + mobile) verdes; Brakeman limpo; bundle ≤ 120 KiB.
- [ ] Flags documentadas, rollback testado (desligar a flag remove a ferramenta e o formulário).
- [ ] `tasks.md`, `IMPLEMENTATION_STATUS.md` e o TASKLIST GA4 refletem o estado real.

## 10. Fora de escopo (v1)
- Simulador de financiamento com taxa real de banco.
- Domínio próprio ou branding completo (Enterprise): fica para a v2.
- Checkout, pagamento ou proposta automática.
- Novos widgets MCP além da vitrine.

## 11. Decisões pendentes (dono: Produto/usuário)
| ID | Decisão | Opções |
|---|---|---|
| D1 | O que o plano `essential` mostra na vitrine | (a) cabeçalho + produtos + avaliações, sem portfólio · (b) portfólio limitado a 1 projeto |
| D2 | Canonical vitrine × perfil | (a) vitrine é a canônica comercial · (b) vitrine `noindex`/canonical para o perfil |
| D3 | Persistência dos settings Pro | (a) nova tabela `storefront_settings` · (b) reaproveitar uma tabela de configuração existente (ex.: `company_proposal_settings`, a verificar) |
| D4 | Fonte das premissas do simulador | (a) tabela por UF mantida pelo admin · (b) constantes revisadas trimestralmente |
| D5 | Metas numéricas M5, M6 e M8 | definir depois do baseline de 30 dias |

## 12. Riscos
| Risco | Mitigação |
|---|---|
| Ligar a flag MCP antes da F0 expõe o erro | Manter as flags desligadas até a F0 entrar em produção |
| Gating mal feito esconde o conteúdo do consumidor e prejudica o integrador pagante | Testes de plano por papel (dono × visitante) |
| Spam no formulário | Rack::Attack + honeypot + validação de contato |
| Simulador visto como promessa | Premissas, rótulo e revisão jurídica do texto |
| Divergência documentação × código recorrente | Drift report (`egm-drift-report`) como gate antes do release (G13 da `spec.md`) |
