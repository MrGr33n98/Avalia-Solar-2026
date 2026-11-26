# SPEC 026 — Agentic Storefront MVP A+++

**Status:** Rascunho Inicial para Revisão EGM (Draft)  
**Versão:** 0.1.0  
**Data:** 26 de Novembro de 2026  
**Autores:** Equipe de Arquitetura & Engenharia Avalia Solar 2026  
**Governança:** Elephant-Goldfish Model (EGM) + Spec Kit + 37signals Rails  

---

## 1. Missão e Visão do Produto

O **Agentic Storefront** é a vitrine comercial digital e agent-native do integrador solar no ecossistema Avalia Solar.
Ele transforma o perfil estático da empresa em um canal ativo de geração de demanda, conversão e relacionamento qualificado, operando tanto na web tradicional (Next.js 14 App Router, PWA-first) quanto em agentes autônomos de IA através do protocolo MCP (Model Context Protocol) e do MCP Apps SDK.

### Proposta de Valor
- **Para o Integrador Solar (B2B):** Uma vitrine profissional e verificada que exibe sua reputação auditada, certificações, marcas homologadas, portfólio de projetos instalados, simuladores solares e formulário de orçamento direto, com gestão integrada no Company Dashboard (SPEC 022).
- **Para o Comprador / Consumidor Final (B2C):** Uma experiência confiável, transparente e sem atritos para explorar a capacidade técnica do integrador, simular sua economia fotovoltaica e solicitar propostas personalizadas sem spam.
- **Para Agentes de IA (Agentic Web):** Uma superfície interativa (`ui://avalia-solar/storefront/v1.html`) que permite a agentes como ChatGPT, Claude e Gemini apresentar a vitrine do integrador diretamente no chat com componentes interativos nativos (`@avalia-solar/mcp-ui`).

---

## 2. ADDENDUM — ELEPHANT-GOLDFISH ENGINEERING GOVERNANCE

> [!IMPORTANT]
> Este addendum estabelece a metodologia obrigatória de engenharia e governança de qualidade que rege toda a concepção, revisão, implementação e validação da SPEC 026.

### 2.1 Objetivo
Integrar o **Elephant-Goldfish Model (EGM)** ao ciclo de desenvolvimento da **SPEC 026 — Agentic Storefront MVP A+++**, utilizando-o como mecanismo independente de revisão arquitetural, validação documental e detecção de divergências entre especificação e implementação real.

### 2.2 Metodologias Obrigatórias
1. **Elephant-Goldfish Model (EGM):** Separação estrita entre agente autor (Elephant), auditores independentes com contexto novo (Goldfish) e decisão arquitetural humana.
2. **Spec Kit / SDD (Specification-Driven Development):** Governança formal de requisitos através de artefatos estruturados (`spec.md`, `plan.md`, `tasks.md`).
3. **DDD Pragmático (Domain-Driven Design):** Contextos delimitados claros (Storefront, Catalog, Simulation, Inquiries, Entitlements).
4. **37signals Rails:** Arquitetura limpa em Rails 7, convenções consagradas, Service Objects dedicados, Pundit policies e zero dependências pesadas desnecessárias.
5. **TDD / BDD:** Desenvolvimento guiado por testes rigorosos no padrão RED → GREEN → REFACTOR cobrindo modelos, serviços, endpoints REST/GraphQL e componentes de UI.
6. **Contract-Driven Development (CDD):** Contratos estritos de dados validados por Zod no frontend e JSON Schema / AMS no backend.
7. **Design-Driven Development:** Qualidade visual premium inspirada na densidade do Tremor UI e tokens oficiais do Avalia Solar (AS-EDS).
8. **MCP Apps SDK:** Interfaces agent-native isoladas via `@modelcontextprotocol/ext-apps` v2.0.4, PostMessage bridge e CSP estrita.
9. **Security-First:** Isolamento multi-tenant intransigente (`Company`), proteção anti-IDOR, validação de edge signature e sanitização de PII (LGPD).
10. **Performance-First:** Latência de backend p95 $\le 150\text{ms}$, bundles de superfícies MCP $\le 120\text{ KiB}$ gzip, Core Web Vitals no padrão verde.

---

### 2.3 Fases Operacionais do Ciclo EGM na SPEC 026

#### FASE 01 — ELEPHANT DISCOVERY
- Utilizar `egm-bootstrap` para inventariar as capacidades existentes da SPEC 022 (Dashboard), SPEC 021 (UI Registry) e SPEC 025 (Public MCP Ecosystem).
- Executar discovery estritamente read-only, inspecionando modelos (`Company`, `Product`, `Review`, `Lead`), rotas e controllers existentes.
- Preservar a arquitetura, contratos e a constituição técnica do repositório (`AGENTS.md`).

#### FASE 02 — BRAINSTORM E ESPECIFICAÇÃO
- Utilizar as skills: `egm-brainstorm`, `egm-draft`, `speckit-specify`, `speckit-clarify`, `37signals-rails`, `product-capability`, `product-lens` e `multi-tenancy`.
- Consolidar as decisões neste arquivo canônico (`spec.md`), sem criar documentos concorrentes como fontes de verdade paralelas.

#### FASE 03 — GOLDFISH REVIEW
- Executar `egm-review` ou `egm-review-loop` com contextos frescos e isolados, cobrindo os 5 estágios:
  1. **Initial Zoom Out (Estágio 5):** Questionar se o Storefront resolve a dor real de conversão do integrador sem excesso de escopo.
  2. **Comprehension (Estágio 6):** Validar se a especificação é compreensível sem o histórico de conversas do agente.
  3. **Design Critique (Estágio 7):** Auditar integridade arquitetural, N+1 queries, concorrência, idempotência e escalabilidade.
  4. **Intermediate Zoom Out (Estágio 8):** Avaliar se as correções propostas nos estágios anteriores introduziram complexidade acidental.
  5. **Implementation Readiness (Estágio 9):** Verificar se o código pode ser implementado com precisão cirúrgica sem suposições inventadas.
- Aplicar os revisores nativos do EGM (`egm-zoom-out`, `egm-design`, `egm-comprehension`, `egm-implementation-readiness`, etc.) complementados pelas 10 personas customizadas do Avalia Solar (`as_rails`, `as_multitenant`, `as_mcp`, `as_apps_sdk`, `as_dashboard`, `as_entitlement`, `as_performance`, `as_trust`, `as_product`, `as_security`).
- Fornecer apenas documentos canônicos, contratos e arquivos de código referenciados; **nunca fornecer o histórico conversacional do Elephant aos revisores Goldfish**.

#### FASE 04 — RESOLUÇÃO E CONVERGÊNCIA
- Utilizar `egm-resolve` para consolidar findings em `specs/026-agentic-storefront/egm/findings-traceability.md`.
- Classificar cada apontamento como: `Blocker`, `Major`, `Nit`, `Accepted risk` (em `accepted-risks.md`), `Contested` ou `Not run`.
- Aplicar a regra de convergência: **duas rodadas consecutivas sem novos blockers ou majors não resolvidos**, com teto de 5 rodadas.
- Registrar decisões arquiteturais aprovadas em `architectural-decisions.md`.

#### FASE 05 — IMPLEMENTAÇÃO
- Somente iniciar o código após aprovação formal dos requisitos e decisões arquiteturais.
- Executar o workflow Spec Kit: `speckit-plan`, `speckit-tasks`, `speckit-analyze`, `speckit-implement`.
- Seguir o ciclo TDD RED → GREEN → REFACTOR.
- Utilizar `egm-lite` para pequenas correções e ajustes cirúrgicos.

#### FASE 06 — VERIFICAÇÃO
- Executar suite multi-camada: RSpec, Jest, Vitest, Playwright E2E, testes de contrato, auditoria de segurança Brakeman e verificação de bundle budget.

#### FASE 07 — CONVERGÊNCIA FINAL
- Executar `egm-drift-report` comparando a especificação aprovada com o código implementado.
- Executar `speckit-converge` e `speckit-checklist` para certificar que 100% das tarefas foram entregues sem regressão.

---

## 3. Matriz de Quality Gates Obrigatórios (G00 a G18)

| Gate | Descrição da Validação | Status Atual |
|---|---|:---:|
| **G00** | **Discovery Read-Only:** Inspeção de modelos, rotas e tabelas existentes | Concluído |
| **G01** | **SPEC Kit Consistente:** `spec.md` canônica elaborada com requisitos e cenários | Em Progresso |
| **G02** | **Arquitetura 37signals Rails:** Modelagem pura em Rails 7 com Service Objects | Pendente de Revisão |
| **G03** | **Modelagem DDD:** Contextos delimitados e invariantes de domínio | Pendente de Revisão |
| **G04** | **Revisão Goldfish Independente:** Execução dos 5 estágios EGM com subagentes | Pendente de Execução |
| **G05** | **Blockers Arquiteturais Resolvidos:** Zero blockers e majors abertos | Pendente de Execução |
| **G06** | **Aprovação da Arquitetura:** Assinatura formal do Tech Lead | Pendente de Aprovação |
| **G07** | **TDD RED/GREEN/REFACTOR:** Testes RSpec/Vitest escritos antes da implementação | Pendente |
| **G08** | **Contratos API/MCP/SDK:** Schemas Zod e JSON Schema versionados | Pendente |
| **G09** | **Segurança Multi-Tenant:** Pundit policies e escopo estrito por empresa | Pendente |
| **G10** | **UI/UX Compatível com SPEC 022:** Componentes responsivos AS-EDS e Tremor density | Pendente |
| **G11** | **Playwright E2E:** Jornadas completas testadas em desktop e mobile | Pendente |
| **G12** | **Performance Budgets:** Budgets de bundle ($\le 120\text{ KiB}$) e latência validados | Pendente |
| **G13** | **EGM Drift Report:** Código em estrita conformidade com a especificação | Pendente |
| **G14** | **Spec Kit Converge:** Fechamento e reconciliação de tarefas | Pendente |
| **G15** | **CI Aprovado:** Pipeline GitHub Actions verde | Pendente |
| **G16** | **Staging Validado:** Homologação com feature flags ativas | Pendente |
| **G17** | **Rollback Validado:** Plano de contingência testado | Pendente |
| **G18** | **Release Readiness:** Validação final e autorização para produção | Pendente |

---

## 4. Escopo do MVP (Funcionalidades Principais)

1. **Vitrine Pública do Integrador (`/storefront/[company_slug]`):**
   - Cabeçalho institucional com marca, cidade/UF, selo de verificação e nota auditada.
   - Grade de módulos, inversores e kits solares comercializados e homologados.
   - Carrossel snap-scroll de projetos instalados com fotos e potência (kWp).
   - Widget embutido da Calculadora Solar (`solar-calculator`) e Simulador de Financiamento (`financing-simulator`).
   - Formulário de rascunho de orçamento direto (`quote-draft`) com validação LGPD.

2. **Superfície Agent-Native MCP (`ui://avalia-solar/storefront/v1.html`):**
   - Pacote singlefile HTML responsivo compatível com ChatGPT Apps, Claude e Cursor.
   - Acoplado ao tool `show_storefront_profile`.
   - Limite estrito de 120 KiB gzip e CSP isolada.

3. **Painel de Gestão B2B no Company Dashboard (SPEC 022):**
   - Aba "Storefront / Vitrine" no dashboard da empresa para customização de catálogo e projetos.
   - Métricas de visualização, cliques e leads originados pela vitrine.
   - Feature gating conforme o plano de assinatura (Free: vitrine básica; Pro: portfólio ampliado; Enterprise: custom branding completo e prioridade de busca).
