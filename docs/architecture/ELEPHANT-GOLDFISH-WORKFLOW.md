# Workflow de Engenharia Avalia Solar: Elephant-Goldfish Model (EGM) + Spec Kit + 37signals Rails

**Status:** Padrão Oficial de Engenharia Arquitetural (A+++)  
**Versão:** 1.0.0  
**Data:** 26 de Novembro de 2026  
**Licença Base:** Apache-2.0 (Google Elephant-Goldfish Model) + Avalia Solar Proprietary Standard

---

## 1. Visão Geral e Filosofia do Elephant-Goldfish Model (EGM)

O **Elephant-Goldfish Model (EGM)** é uma metodologia de desenvolvimento assistido por IA open source que resolve o problema fundamental do viés de confirmação em agentes de software: **o agente que concebe e escreve uma especificação ou arquitetura não pode ser o único responsável por auditá-la**.

O modelo divide as responsabilidades em três entidades com papeis estritos:

| Entidade | Tipo | Responsabilidade Central | Memória / Contexto |
|---|---|---|---|
| **Elephant (Elefante)** | Agente Raiz | Mantém o contexto de longo prazo do projeto, histórico de decisões (MADR/ADRs), regras de negócio, contratos de dados e restrições. Redige a especificação canônica. | Contexto conversacional completo e cumulativo |
| **Goldfish (Peixinho)** | Subagentes Concorrentes | Auditores adversariais e céticos que avaliam a especificação com "olhar fresco" e sem histórico prévio, lendo apenas os documentos canônicos e código-fonte referenciado. | Contexto novo e isolado (stateless, sem viés conversacional) |
| **Humano (Arquiteto/Tech Lead)** | Desenvolvedor / Lead | Arbitra impasses, aprova riscos aceitos (`accepted-risks.md`), resolve decisões de design e emite aprovação formal para início da implementação. | Autoridade decisória final |

---

## 2. O Catálogo das 8 Skills do EGM no Avalia Solar

As 8 skills oficiais do EGM estão integradas ao repositório em `.agents/elephant-goldfish-model/skills/` e espelhadas para `.agents/skills/` e `.claude/skills/`:

| Skill | Finalidade | Momento no Workflow |
|---|---|---|
| `egm-brainstorm` | Exploração de ideias, trade-offs e alternativas conceituais | Discovery inicial e delimitação do escopo do MVP |
| `egm-draft` | Redação iterativa e estruturada da especificação técnica | Elaboração de requisitos, arquitetura e contratos |
| `egm-review` | Orquestração da revisão Goldfish de 5 fases | Validação formal pré-implementação |
| `egm-resolve` | Triagem, consolidação e resolução de findings reportados | Convergência arquitetural e rastreabilidade |
| `egm-bootstrap` | Documentação arquitetural e de código legado já existente | Levantamento AS-IS de módulos existentes |
| `egm-lite` | Ciclo rápido de brainstorm + rascunho + revisão em iteração única | Quick wins, correções e PRs cirúrgicos |
| `egm-review-loop` | Driver de loop de revisão automatizada até convergência | Auditoria contínua de segurança, performance e MCP |
| `egm-drift-report` | Comparação forense entre documentação técnica e código real | Detecção de divergências pré e pós-release |

---

## 3. Workflow de Engenharia Unificado (14 Etapas)

Toda funcionalidade estruturante (como o **Agentic Storefront — SPEC 026**) segue obrigatoriamente o seguinte pipeline:

```
┌────────────────────────────────────────────────────────┐
│ 01. DISCOVERY READ-ONLY (G00)                          │
│     Auditoria do código real, rotas, banco e contratos │
└──────────────────────────┬─────────────────────────────┘
                           ▼
┌────────────────────────────────────────────────────────┐
│ 02. ELEPHANT CONTEXT & BOOTSTRAP                       │
│     Carregamento do constitution, ADRs e histórico     │
└──────────────────────────┬─────────────────────────────┘
                           ▼
┌────────────────────────────────────────────────────────┐
│ 03. EGM BRAINSTORM & CONCEPTS BRIEF                    │
│     Exploração de alternativas e trade-offs            │
└──────────────────────────┬─────────────────────────────┘
                           ▼
┌────────────────────────────────────────────────────────┐
│ 04. SPEC KIT SPECIFY & CLARIFY (G01)                   │
│     Elaboração de spec.md com requisitos canônicos     │
└──────────────────────────┬─────────────────────────────┘
                           ▼
┌────────────────────────────────────────────────────────┐
│ 05. MODELAGEM DDD + 37SIGNALS RAILS (G02, G03)         │
│     Service objects, Pundit, schemas Zod e DTOs        │
└──────────────────────────┬─────────────────────────────┘
                           ▼
┌────────────────────────────────────────────────────────┐
│ 06. EGM GOLDFISH REVIEW (5 NÍVEIS) (G04)               │
│     Subagentes isolados executando estágios 5 a 9      │
└──────────────────────────┬─────────────────────────────┘
                           ▼
┌────────────────────────────────────────────────────────┐
│ 07. EGM RESOLVE & TRACKING (G05)                       │
│     Resolução de Blockers, Majors e Nits               │
└──────────────────────────┬─────────────────────────────┘
                           ▼
┌────────────────────────────────────────────────────────┐
│ 08. APROVAÇÃO ARQUITETURAL FORMAL (G06)                │
│     Validação pelo Tech Lead humano                    │
└──────────────────────────┬─────────────────────────────┘
                           ▼
┌────────────────────────────────────────────────────────┐
│ 09. SPEC KIT PLAN & TASKS                              │
│     Geração de plan.md e tasks.md ordenadas            │
└──────────────────────────┬─────────────────────────────┘
                           ▼
┌────────────────────────────────────────────────────────┐
│ 10. TDD / BDD CICLO RED → GREEN → REFACTOR (G07)       │
│     Specs RSpec, Vitest e Jest antes da implementação  │
└──────────────────────────┬─────────────────────────────┘
                           ▼
┌────────────────────────────────────────────────────────┐
│ 11. IMPLEMENTAÇÃO MULTI-CAMADA (G08, G09, G10)         │
│     Backend Rails + MCP Tools + Frontend Next.js / UI  │
└──────────────────────────┬─────────────────────────────┘
                           ▼
┌────────────────────────────────────────────────────────┐
│ 12. VERIFICAÇÃO MULTI-DIMENSIONAL (G11, G12)           │
│     Playwright E2E + Segurança + Budgets de Performance│
└──────────────────────────┬─────────────────────────────┘
                           ▼
┌────────────────────────────────────────────────────────┐
│ 13. EGM DRIFT REPORT & SPEC KIT CONVERGE (G13, G14)    │
│     Validação de código real vs especificação aprovada │
└──────────────────────────┬─────────────────────────────┘
                           ▼
┌────────────────────────────────────────────────────────┐
│ 14. CI/CD GATES & PROGRESSIVE DELIVERY (G15 a G18)     │
│     CI verde → Staging → Canário → Produção            │
└────────────────────────────────────────────────────────┘
```

---

## 4. Os Cinco Níveis de Revisão Goldfish (`egm-review`)

A revisão de especificações é decomposta em 5 estágios rigorosos:

| Estágio EGM | Nome do Estágio | Foco da Auditoria | Subagentes Concorrentes Envolvidos |
|---|---|---|---|
| **Estágio 5** | **Initial Zoom Out** | Avalia se a proposta resolve o problema correto de negócio ou se adiciona complexidade desnecessária | `egm-zoom-out`, `egm-inventive-catalyst` |
| **Estágio 6** | **Comprehension** | Avalia se o documento é auto-suficiente e claro para um desenvolvedor sem histórico prévio | `egm-comprehension`, `egm-style` |
| **Estágio 7** | **Design Critique** | Encontra falhas arquiteturais, gargalos de escalabilidade, suposições falsas e riscos não mitigados | `egm-design`, `egm-structural` |
| **Estágio 8** | **Intermediate Zoom Out**| Verifica se as correções introduzidas durante a revisão não criaram nova complexidade acidental | `egm-zoom-out`, `egm-inventive-catalyst` |
| **Estágio 9** | **Implementation Readiness**| Valida se a especificação possui detalhes técnicos suficientes para um agente implementar sem inventar | `egm-implementation-readiness`, `egm-codebase-details` |

---

## 5. Personas Customizadas de Revisão do Avalia Solar

Além dos revisores nativos do EGM, o Avalia Solar define 10 revisores especializados em `.agents/elephant-goldfish-model/agents/custom/`:

| Persona | Identificador | Especialidade de Auditoria |
|---|---|---|
| **Avalia Solar Rails Reviewer** | `as_rails.md` | Padrões Rails 7, Ruby 3.2.2, 37signals, Service Objects, ausência de N+1 (Bullet/preload) |
| **Multi-Tenant Reviewer** | `as_multitenant.md` | Isolamento estrito de `Company`, proteção anti-IDOR, ausência de vazamento cross-tenant |
| **MCP Protocol Reviewer** | `as_mcp.md` | Conformidade JSON-RPC 2.0, separação `/mcp` vs `/mcp/private`, anotações e schemas estritos |
| **Apps SDK Reviewer** | `as_apps_sdk.md` | Integração `@modelcontextprotocol/ext-apps` v2.0.4, `HostProvider`, CSP e budget $\le 120\text{ KiB}$ gzip |
| **Dashboard Reviewer** | `as_dashboard.md` | Compatibilidade visual com SPEC 022, alta densidade Tremor UI, navegação B2B fluida |
| **Entitlement Reviewer** | `as_entitlement.md` | Feature gating no backend/Pundit, cotas atômicas, planos Free/Pro/Enterprise |
| **Performance Reviewer** | `as_performance.md` | Latência p95, queries indexadas, Core Web Vitals (LCP, CLS, INP) e memória |
| **Trust Integrity Reviewer** | `as_trust.md` | Veracidade das avaliações, nunca inventar 0.0 quando amostra é zero, selos auditados |
| **Product Reviewer** | `as_product.md` | Proposta de valor clara, fricção de conversão reduzida, escopo disciplinado de MVP |
| **Security Reviewer** | `as_security.md` | Autenticação Devise/JWT, sanitização contra XSS, proteção de PII (LGPD), Rack::Attack |

---

## 6. Critérios de Convergência do Loop de Revisão (`egm-review-loop`)

O `egm-review-loop` aplica uma regra matemática estrita de convergência antes de liberar a especificação para implementação:
- **Critério de Parada Positivo:** **Duas rodadas consecutivas** sem novos findings classificados como `[BLOCKER]` ou `[MAJOR]` não resolvidos.
- **Limite Máximo de Segurança:** Máximo de **5 rodadas** por sessão. Se não convergir após 5 rodadas, o processo é pausado para intervenção humana do Tech Lead.
- **Classificação Canônica de Findings:**
  1. `[BLOCKER]`: Impede categoricamente o início da implementação (risco de segurança, quebra de multi-tenancy, arquitetura inviável).
  2. `[MAJOR]`: Problema relevante que deve ser corrigido na especificação antes do código.
  3. `[NIT]`: Melhoria textual ou detalhe cosmético que não afeta a segurança ou funcionamento.
  4. `[ACCEPTED_RISK]`: Risco documentado formalmente em `accepted-risks.md` com justificativa de negócio e aprovação humana.
  5. `[CONTESTED]`: Finding questionado pelo autor com contra-prova técnica registrada.

---

## 7. Matriz Oficial de Quality Gates (G00 a G18)

| Gate | Validação Exigida | Obrigatório |
|---|---|:---:|
| **G00** | **Discovery Read-Only:** Inspeção do código real, schema e rotas sem alterações | ✓ |
| **G01** | **SPEC Kit Consistente:** `spec.md` completo com contratos e cenários | ✓ |
| **G02** | **Arquitetura 37signals Rails:** Simplicidade, Service Objects, zero dependências inúteis | ✓ |
| **G03** | **Modelagem DDD:** Contextos delimitados, entidades de domínio e invariantes de negócio | ✓ |
| **G04** | **Revisão Goldfish Independente:** Execução dos 5 estágios EGM com subagentes isolados | ✓ |
| **G05** | **Blockers Arquiteturais Resolvidos:** Zero blockers ou majors pendentes no `findings-traceability.md` | ✓ |
| **G06** | **Aprovação da Arquitetura:** Assinatura formal do Tech Lead em `architectural-decisions.md` | ✓ |
| **G07** | **TDD RED/GREEN/REFACTOR:** Testes unitários/integração escritos e falhando antes da implementação | ✓ |
| **G08** | **Contratos API/MCP/SDK:** Schemas Zod e JSON Schema documentados e com tipagem estrita | ✓ |
| **G09** | **Segurança Multi-Tenant:** Pundit policies e escopo estrito de `Company` em 100% dos fluxos | ✓ |
| **G10** | **UI/UX Compatível com SPEC 022:** Componentes responsivos, design tokens AS-EDS, densidade premium | ✓ |
| **G11** | **Playwright E2E:** Jornadas de usuário reais testadas em Desktop e Mobile (2 temas, teclado, a11y) | ✓ |
| **G12** | **Performance Budgets:** Singlefile $\le 120\text{ KiB}$ gzip, LCP $\le 2.5\text{s}$, API p95 $\le 150\text{ms}$ | ✓ |
| **G13** | **EGM Drift Report:** Execução de `egm-drift-report` validando aderência entre código e SPEC | ✓ |
| **G14** | **Spec Kit Converge:** Relatório final de convergência sem tarefas pendentes em `tasks.md` | ✓ |
| **G15** | **CI Aprovado:** Pipeline GitHub Actions verde (RuboCop, Brakeman, RSpec, ESLint, Vitest) | ✓ |
| **G16** | **Staging Validado:** Smoke test funcional em ambiente homologado com feature flags ativas | ✓ |
| **G17** | **Rollback Validado:** Procedimento documentado e testado de reversão para flags OFF ou commit anterior | ✓ |
| **G18** | **Release Readiness:** Checklist final de lançamento aprovado para produção | ✓ |

---

## 8. Comandos de Execução para Agentes

### Antigravity e Claude Code
```bash
# Executar revisão Goldfish em uma especificação
/egm:egm-review specs/026-agentic-storefront/spec.md

# Executar loop de auditoria automatizada até convergência
/egm:egm-review-loop specs/026-agentic-storefront/spec.md

# Validar drift entre especificação e código implementado
/egm:egm-drift-report specs/026-agentic-storefront/
/egm:egm-drift-report specs/021-agent-native-ui-registry/
/egm:egm-drift-report specs/022-dashboard-tremor-a-plus/
```

### Instalação como Plugin Oficial do Antigravity
O plugin também pode ser instalado globalmente através do Marketplace do Antigravity:
```bash
agy plugin install https://github.com/google/elephant-goldfish-model
```
Ou no chat através do componente oficial:
`<plugin-card catalog-id="antigravity-plugins-official/plugin/egm"></plugin-card>`

