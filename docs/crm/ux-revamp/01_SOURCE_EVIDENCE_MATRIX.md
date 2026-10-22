# 01 — Matriz de Evidências das Fontes (Nutshell x Avalia Solar)

## 1. Contexto das Fontes e Limites de Confiança
A documentação pedagógica de engenharia reversa do APK Nutshell (`docs/0.0.0.1-crm-nutshell/`) serviu como referência comparativa de arquitetura e padrões funcionais. 

> [!WARNING]
> Conforme detalhado em `01_ENVIRONMENT_READINESS.md`, o ambiente de inspeção do APK estava desprovido de JADX CLI e ADB ativo, tornando as claims dos artefatos estáticas (E0/E1). Nenhum código, asset visual ou biblioteca externa foi ou deve ser copiado. Toda implementação no Avalia Solar é **clean-room**, baseada em contratos nativos Rails e componentes React/Next.js existentes.

---

## 2. Matriz de Mapeamento e Decisão por Documento

| ID Canônico | Documento de Referência | Temas Principais | Código / Contrato Avalia Solar Real | Decisão de Adaptação | Confiança |
|-------------|-------------------------|------------------|-------------------------------------|----------------------|-----------|
| **NS-00** | `00_EXECUTIVE_SUMMARY.md` | Visão geral, arquitetura e limites do estudo | `AB0-1-back/config/routes.rb:62-230`, `AB0-1-front/app/dashboard/sales/` | **REUTILIZAR**: Stack Rails REST + Next.js App Router | E3 (Verificado local) |
| **NS-01** | `01_ENVIRONMENT_READINESS.md` | Limites REA, ausência de JADX CLI/ADB | Hosts locais Linux, node 20, Rails 7 | **MANTER**: Regra de auditoria independente e clean-room | E3 (Verificado local) |
| **NS-02** | `02_APK_INVENTORY.md` | Manifest, intents, pacotes nativos | Não aplicável ao Next.js / PWA web | **REJEITAR**: Sem APK ou código nativo Java/Kotlin no frontend web | E1 (Referência apenas) |
| **NS-03** | `03_ARCHITECTURE_MAP.md` | Separação de camadas e navegação | `SalesLayoutWrapper.tsx`, `CRMSidebar.tsx`, `CRMTopbar.tsx` | **ADAPTAR**: Shell responsivo Web + PWA sem mudar marca | E3 (Verificado local) |
| **NS-04** | `04_CLASS_DEPENDENCY_MATRIX.md` | Inventário de telas e dependências | `app/dashboard/sales/**/page.tsx` | **REUTILIZAR**: Rotas canônicas Next.js existentes | E3 (Verificado local) |
| **NS-05** | `05_UI_UX_INVENTORY.md` | Telas, fichas 360°, bottom sheets, estados | `Company360View.tsx`, `Contact360View.tsx`, `Opportunity360View.tsx` | **REFATORAR/ADAPTAR**: Adotar bottom sheets ≤ 70dvh e densidade limpa | E3 (Verificado local) |
| **NS-06** | `06_CRM_FEATURE_INVENTORY.md` | Backlog funcional e capacidades | `Sales::Opportunity`, `Sales::Account`, `Sales::Contact`, `Sales::Activity` | **REUTILIZAR**: Modelos e controllers existentes no backend | E3 (Verificado local) |
| **NS-07** | `07_DATA_FLOW_ANALYSIS.md` | Mutations, cache, fluxos comerciais | `lib/api/sales/client.ts`, `mutations.ts`, `queries.ts` | **REFATORAR**: Corrigir invalidações de cache e eliminar falso sucesso | E3 (Verificado local) |
| **NS-08** | `08_STATE_PERSISTENCE_ANALYSIS.md` | TanStack Query, Zustand, offline | `store/**`, `@tanstack/react-query`, `lib/offline/config.ts` | **ADAPTAR**: TanStack para server state, Zustand para UI efêmera | E3 (Verificado local) |
| **NS-09** | `09_NETWORK_ARCHITECTURE.md` | Operações GraphQL de benchmark | REST `/api/v1/sales/*` em Rails | **REJEITAR**: Manter REST no CRM; não criar camada GraphQL redundante | E3 (Verificado local) |
| **NS-10** | `10_ARCHITECTURAL_PATTERNS.md` | Padrões de adaptação limpa | Primitives Radix + Tailwind com design tokens AS-EDS | **REUTILIZAR**: Tokens e componentes existentes | E3 (Verificado local) |
| **NS-11** | `11_GAP_ANALYSIS.md` | Lacunas identificadas no benchmark | Matriz em `docs/crm/ux-revamp/02_GAP_MATRIX.md` | **ADAPTAR**: Focar em bugs P0 e responsividade PWA | E3 (Verificado local) |
| **NS-12** | `12_RECOMMENDATIONS.md` | Sugestões genéricas da consultoria | Dexie vs WatermelonDB, Twilio vs Registro Manual | **REJEITAR**: Dispensar WatermelonDB e Twilio; manter stack enxuta | E3 (Verificado local) |
| **NS-13** | `13_EVIDENCE_REGISTER.md` | Registro de claims e rastreabilidade | Tabela de rastreabilidade em `15_TRACEABILITY.md` | **MANTER**: Rastreabilidade formal por commit e teste | E3 (Verificado local) |
