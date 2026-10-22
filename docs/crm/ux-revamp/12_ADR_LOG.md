# 12 — Registro de Decisões de Arquitetura (ADR Log)

## ADR-001: Manutenção da Arquitetura REST em Ruby on Rails no CRM
- **Contexto:** A documentação de engenharia reversa de terceiros (Nutshell) faz menção a chamadas GraphQL proprietárias.
- **Decisão:** Manter 100% dos endpoints do CRM Avalia Solar em **RESTful Rails (`/api/v1/sales/*`)**.
- **Justificativa:** A infraestrutura REST existente possui controllers, serializers e políticas de Pundit testadas e maduras. Introduzir uma segunda camada GraphQL traria complexidade desnecessária sem ganho técnico comprovado.
- **Status:** **APROVADO / EM VIGOR**.

---

## ADR-002: Rejeição de WatermelonDB / PowerSync para o CRM
- **Contexto:** Relatórios externos sugerem uso de bancos locais embutidos como WatermelonDB ou PowerSync.
- **Decisão:** **Rejeitar**. O Avalia Solar adota TanStack Query v5 para sincronização de estado com o servidor e Dexie/IndexedDB exclusivamente para leitura de catálogo público em rotas permitidas.
- **Justificativa:** Mutações comerciais exigem validação de regras de negócio, cálculo fiscal e integridade de estoque no servidor. Filas offline arbitrárias em CRM privado expõem risco severo de inconsistência e vazamento de dados.
- **Status:** **REJEITADO (Proposta Externa)**.

---

## ADR-003: Shell Responsivo Unificado com Bottom Navigation PWA
- **Contexto:** Vendedores precisam operar o CRM em computadores e em smartphones em campo com ergonomia adequada.
- **Decisão:** Adotar `SalesLayoutWrapper` responsivo que renderiza:
  - Sidebar desktop e Topbar completa em `≥ 768px`.
  - Header compacto e `CRMMobileBottomNav` (5 destinos) em `< 768px`, ocultando o rodapé público do marketplace.
- **Justificativa:** Experiência consistente em um único código Next.js sem duplicar páginas ou manter rotas separadas para mobile.
- **Status:** **APROVADO / EM IMPLEMENTAÇÃO**.

---

## ADR-004: Eliminação de Falsos Positivos em Registros de Atividades
- **Contexto:** Identificado que `CallLoggerModal.tsx` exibia mensagem de sucesso mesmo em falhas de rede ou ausência de ID de conta.
- **Decisão:** Tornar obrigatória a validação de `response.ok`, recebimento de ID gerado pelo backend e contexto válido de conta antes de emitir feedback positivo.
- **Justificativa:** A integridade do histórico comercial é fundamental para a gestão de vendas e não pode tolerar registros fantasmas.
- **Status:** **APROVADO / EM IMPLEMENTAÇÃO**.
