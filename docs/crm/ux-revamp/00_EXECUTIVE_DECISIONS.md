# 00 — Decisões Executivas & Escopo do CRM Avalia Solar

## 1. Visão Geral e Objetivo do Produto
O objetivo desta iniciativa é consolidar e elevar a experiência do **CRM Comercial Interno do Avalia Solar**, garantindo paridade funcional consistente entre **Web App (desktop/tablet ≥ 768px)** e **PWA Mobile (< 768px)**, mantendo uma única base de código, uma única suíte de APIs REST em Ruby on Rails e os componentes visuais oficiais da marca Avalia Solar.

O CRM serve exclusivamente à **operação comercial interna** do fundador e equipe de vendas do Avalia Solar para prospecção, qualificação, negociação de assinaturas SaaS e planos institucionais.

---

## 2. Limites Inegociáveis de Negócio & Governança

1. **Uso Exclusivo Interno:** O CRM não deve ser exposto como solução white-label ou CRM B2B para integradores terceiros sem especificação e aprovação de negócio futura.
2. **Sem Venda ou Monetização de Contatos do Marketplace:** O Avalia Solar **não vende, não entrega mediante remuneração e não garante volume de leads** para empresas. Contatos orgânicos entre consumidores e integradores no marketplace permanecem isolados e não podem ser convertidos automaticamente em oportunidades de venda interna.
3. **Monetização Autêntica:** A monetização é baseada em planos de assinatura da plataforma (Gratuito, Essencial, Pro, Enterprise), perfis premium certificados, publicidade institucional e ferramentas de inteligência autorizadas.
4. **Preços Canônicos:** Não há hardcoding de valores monetários no frontend como fonte da verdade. O backend Rails e os catálogos vigentes são a única autoridade de precificação.
5. **Separação de Entidades e LGPD:** Separação estrita entre `Company` (marketplace público), `Sales::Account` (conta comercial interna), `Sales::Contact` (pessoa de contato), `Sales::Opportunity` (oportunidade de negócio) e `Lead` (contato inbound). Nenhuma reputação pública ou selo de avaliação pode ser influenciado pelo status comercial do CRM.

---

## 3. Decisões Arquiteturais e Tecnológicas (Clean-Room)

### 3.1 Tecnologias Preservadas e Canônicas
- **Frontend:** Next.js 14.2 (App Router), React 18, TypeScript, Tailwind CSS com tokens AS-EDS (`brand.blue`, `brand.green`, `brand.navy`), Radix UI / shadcn, `@tanstack/react-query` v5, Zustand v5.
- **Backend:** Ruby on Rails 7.0.8, PostgreSQL 14+, Pundit / `Sales::TenantScope`, ActionCable (`SalesTimelineChannel`).
- **Comunicação:** REST APIs em `/api/v1/sales/*`.

### 3.2 Propostas Rejeitadas (Não Adotadas da Referência Externa)
- **GraphQL novo:** Rejeitado. O Avalia Solar já possui arquitetura REST madura e consolidada no CRM.
- **WatermelonDB / PowerSync:** Rejeitado. O stack já conta com TanStack Query e Dexie/IndexedDB localmente onde justificado.
- **Twilio / Speech-to-Text Proprietário sem Consentimento:** Rejeitado por custos e privacidade.
- **Design Tokens Externos (IBM Plex Sans, Doyle, Laranja Nutshell):** Rejeitados. Uso exclusivo da identidade visual oficial do Avalia Solar.

---

## 4. Mapa de Riscos Principais

| Risco | Severidade | Mitigação Arquitetural |
|-------|------------|------------------------|
| **Falsos Sucessos em Chamadas/Atividades** | **Crítica (P0)** | Bloqueio imediato de sucesso no frontend sem verificação estrita de `response.ok`, ID da atividade retornado e `sales_account_id` válido. |
| **Vazamento Multi-tenant no CRM** | **Crítica (P0)** | Todo endpoint Rails protegido por `current_tenant_scope` e `AuthorizationService`. Frontend jamais confia em checagens apenas no cliente. |
| **Invasão de Fila Offline Não-Idempotente** | **Alta (P1)** | Manter o CRM em modo seguro online-first com visualização em cache; mutações críticas exigem confirmação explícita de rede. |
| **Conflito de Shell Mobile e Marketplace** | **Alta (P1)** | Ocultar barra pública via `shouldHideMobileNav` (já implementado) e renderizar `CRMMobileBottomNav` estritamente sob `/dashboard/sales/**`. |
