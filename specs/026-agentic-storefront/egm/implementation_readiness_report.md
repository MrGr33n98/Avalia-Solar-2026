# Implementation Readiness Report: SPEC 026 — Agentic Storefront

**Fase EGM:** Estágio 9 — Implementation Readiness & Codebase Conformance  
**Revisores:** `egm-implementation-readiness` (Pragmatic Tech Lead), `egm-codebase-details` (Codebase Auditor), `as-apps-sdk-reviewer`  
**Data da Auditoria:** 26 de Novembro de 2026  
**Status da Rodada:** **APROVADO PARA IMPLEMENTAÇÃO (READY FOR IMPLEMENTATION — A+++)**  
**Referência Canônica:** `specs/026-agentic-storefront/spec.md`  

---

## 1. Visão Geral da Auditoria de Prontidão

O **Estágio 9 (Implementation Readiness)** avalia se o pacote de artefatos da especificação (`spec.md`, `plan.md`, `tasks.md`, `data-model.md`) contém detalhes técnicos e operacionais suficientes para que um desenvolvedor ou agente de código inicie imediatamente o ciclo TDD RED → GREEN → REFACTOR **sem precisar tomar decisões de design em tempo de implementação**.

---

## 2. Checklist de Verificação de Prontidão

| Critério de Prontidão | Status | Evidência nos Documentos |
|---|:---:|---|
| **Contratos de Dados Validados** | **100% OK** | `StorefrontPayloadSchema` e `StorefrontProjectSchema` definidos em Zod no `data-model.md`. |
| **Migrações e Modelos Mapeados** | **100% OK** | Tabela `storefront_settings` modelada com chaves estrangeiras e índices únicos. |
| **Rotas e Endpoints Definidos** | **100% OK** | `GET /api/v1/storefronts/:slug` (Público) e `PUT /app/storefronts/:id` (B2B autenticado). |
| **Ferramenta MCP Especificada** | **100% OK** | Tool `show_storefront_profile` registrado com schema de entrada (`slug`) e anotações read-only. |
| **Segurança e Políticas Pundit** | **100% OK** | `StorefrontPolicy` com métodos `show?` e `update?` vinculados aos membros autenticados. |
| **Orçamento de Performance (Budget)** | **100% OK** | Singlefile bundle $\le 120\text{ KiB}$ gzip fixado e CSS snap-scroll nativo. |
| **Isolamento de Tenants (Anti-IDOR)** | **100% OK** | Regra de resolução restrita ao escopo `current_user.companies` documentada. |
| **Tarefas Ordenadas por Dependência** | **100% OK** | 24 tarefas sequenciais e atômicas descritas no `tasks.md`. |
| **Zero Decisões em Aberto** | **100% OK** | Todos os trade-offs foram fechados nas ADRs do projeto. |

---

## 3. Guia de Execução Cirúrgica para a Fase TDD (RED → GREEN)

### Passo 1: Backend Rails (RSpec)
1. **Teste RED:** Criar `spec/services/storefront/public_profile_service_spec.rb` testando:
   * Montagem do payload com empresa ativa.
   * Lançamento de `ActiveRecord::RecordNotFound` para empresa inativa ou inexistente.
   * Ausência de N+1 queries verificado pelo `Bullet`.
2. **Implementação GREEN:** Criar `app/services/storefront/public_profile_service.rb` e `app/serializers/api/v1/storefront_serializer.rb`.

### Passo 2: Ferramenta MCP e Contratos Zod
1. **Teste RED:** Criar `spec/services/mcp/public/storefront_tool_spec.rb` validando resposta JSON-RPC 2.0.
2. **Implementação GREEN:** Registrar a ferramenta em `app/services/mcp/public_tool_registry.rb`.

### Passo 3: Frontend Next.js e Widget MCP
1. **Teste RED:** Implementar testes de schema Zod em `packages/mcp-ui/src/contracts/__tests__/storefront.test.ts`.
2. **Implementação GREEN:** Desenvolver `StorefrontWidget.tsx` e validar o limite de bundle via `npm run build`.

---

## 4. Veredito Final do Estágio 9

A especificação técnica da SPEC 026 cumpre rigorosamente todos os requisitos da governança Elephant-Goldfish Model e do Spec Kit. O projeto está oficialmente autorizado a avançar para a Fase 05 (Implementação).
