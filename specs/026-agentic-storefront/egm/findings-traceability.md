# Matriz de Rastreabilidade de Findings: SPEC 026 — Agentic Storefront

**Fase EGM:** Fase 04 — Resolução e Convergência  
**Status:** **CONVERGÊNCIA COMPLETA (0 PENDÊNCIAS)**  
**Data:** 26 de Novembro de 2026  

---

| ID | Estágio EGM | Revisor | Severidade | Descrição do Apontamento | Ação Corretiva Aplicada | Status |
|---|---|---|:---:|---|---|:---:|
| **F-05-01** | Estágio 5 | `egm-zoom-out` | **MAJOR** | Risco de duplicação de regras de negócio entre Brand Page e Storefront. | `Storefront` modelado como view-model de `Company`; configurações isoladas na tabela 1:1 `storefront_settings`. | `RESOLVED` |
| **F-05-02** | Estágio 5 | `egm-inventive-catalyst` | **MAJOR** | Complexidade de simulação bancária complexa dentro da superfície MCP estourando 120 KiB. | Escopo do widget limitado à calculadora solar básica de kWh e economia; contratação bancária delegada para etapa pós-lead. | `RESOLVED` |
| **F-05-03** | Estágio 5 | `as-product-reviewer` | **NIT** | Ambiguidade entre integradores locais e fabricantes no escopo do storefront. | Texto ajustado: o Storefront é exclusivo para empresas do tipo integrador ou distribuidor local. | `RESOLVED` |
| **F-06-01** | Estágio 6 | `egm-comprehension` | **MAJOR** | Siglas técnicas e de negócio (AS-EDS, MCP Apps SDK, PORO, AMS, ISR) sem glossário explicativo. | Glossário formal incorporado à introdução da especificação. | `RESOLVED` |
| **F-06-02** | Estágio 6 | `egm-style` | **NIT** | Oscilação entre termos `CompanySetting` e `StorefrontSetting`. | Nomenclatura padronizada estritamente para `StorefrontSetting`. | `RESOLVED` |
| **F-06-03** | Estágio 6 | `egm-style` | **NIT** | Frases passivas nas tarefas operacionais. | Tarefas revisadas com linguagem imperativa e acionável. | `RESOLVED` |
| **F-07-01** | Estágio 7 | `as-multitenant` | **BLOCKER** | Brecha IDOR no controller B2B caso a empresa seja buscada por `slug` global. | Resolução obrigatória via `current_user.companies.find(id)` com autorização estrita via `StorefrontPolicy`. | `RESOLVED` |
| **F-07-02** | Estágio 7 | `as-rails` | **MAJOR** | Risco de N+1 queries na serialização de projetos e produtos da empresa. | `includes(:storefront_setting, :company_projects, company_products: :product)` fixado no service object com validação do Bullet. | `RESOLVED` |
| **F-07-03** | Estágio 7 | `as-security` | **MAJOR** | Vazamento potencial de PII nos logs de orçamentos diretos (`quote-draft`). | Sanitização de dados com Zod no frontend e ofuscação de e-mails/telefones nos logs de servidor. | `RESOLVED` |
| **F-07-04** | Estágio 7 | `as-apps-sdk` | **MAJOR** | Violação de CSP no iframe MCP Apps SDK por dependência de CDNs externos. | Compilação em Singlefile autocontido (Vite singlefile) com fontes de sistema (`system-ui`), sem chamadas remotas de assets. | `RESOLVED` |
| **F-07-05** | Estágio 7 | `egm-structural` | **NIT** | Ausência de rate limiting no endpoint público REST do storefront. | Regra adicionada no `Rack::Attack`: 60 requisições por minuto por IP para `/api/v1/storefronts`. | `RESOLVED` |

---

### Resumo Estatístico de Fechamento:
* **Blockers:** 1 (100% resolvido).
* **Majors:** 5 (100% resolvidos).
* **Nits:** 4 (100% resolvidos).
* **Bloqueios Ativos para Implementação:** **0 (ZERO)**.
