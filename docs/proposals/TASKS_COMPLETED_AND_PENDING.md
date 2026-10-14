# Tarefas Concluídas e Pendentes — Proposal Studio Enterprise

**Data de Fechamento:** 14 de Outubro de 2026  
**Responsável:** Codex Pair Programmer  

---

## 1. Tarefas Concluídas (100% Entregues)

- [x] **Auditoria e Inventário do Estado Real:** Mapeamento completo dos 15 gaps no frontend e backend.
- [x] **Arquitetura de Dados Rails:**
  - Migration aditiva `company_proposal_settings`.
  - Model `CompanyProposalSetting` com validações, enums e defaults neutros.
  - Associação em `Company` (`has_one :proposal_setting`, `proposal_setting_or_default`).
  - Controller `Api::V1::CompanyDashboard::ProposalSettingsController` com Pundit auth e proteção multiempresa.
  - Rotas RESTful registradas em `config/routes.rb`.
- [x] **Cliente de API Tipado:** `companyProposalSettingsApi` adicionado em `AB0-1-front/lib/api.ts`.
- [x] **Remoção de Chat Fixo da Área de Propostas:**
  - Removido `ProposalConversationPane` da 3ª coluna desktop (≥1280px).
  - Removido drawer de chat em viewports tablet (1024–1279px).
  - Removida visualização mobile dedicada de chat do workspace de propostas.
  - Adicionado botão contextual `"Abrir conversa"` em `ProposalDetailsPane` apontando para `/dashboard/inbox?conversation_id=...`.
  - Nenhuma mensagem, histórico ou API de chat foi excluída.
- [x] **Padronização de Upload de PDF:** Limite fixado em 10MB (`ProposalDetailsPane.tsx` e `ProposalDocumentService.rb`).
- [x] **Modularização do Proposal Settings Studio:**
  - `SettingsSidebarNav.tsx`: Navegação 210–224px (Geral, Proposta PDF, Proposta Digital).
  - `PdfModelChooserDrawer.tsx`: Seleção entre 3 modelos originais (`modelo_1`, `modelo_2`, `modelo_3`) com feedback e salvar padrão.
  - `PdfPreviewModal.tsx`: Modal A4 paginado técnico com zoom (70% a 150%) e 3 páginas.
  - `SectionEditorDrawer.tsx`: Drawer de edição contextual de seções, cores, capa, mão de obra e pagamento.
  - `ProposalSettingsStudio.tsx`: Redução de monólito, integração de chamadas backend, UI otimista com rollback.
- [x] **Navegação de Nível Superior:**
  - Abas `Minhas propostas` | `Modelos e configurações` em `CompanyMarketplaceProposalsWorkspace.tsx`.
- [x] **Remoção de Dados Falsos e Fictícios:** Eliminação de garantias de 25 anos inventadas, fotos genéricas e simulações de ROI não fundamentadas.
- [x] **Garantia de Qualidade e Testes:**
  - `__tests__/components/ProposalSettingsStudio.test.tsx` atualizado e passando (6 testes).
  - `__tests__/components/ProposalConversationPane.test.tsx` passando (3 testes).
  - `npm run typecheck` validado com **0 erros**.

---

## 2. Itens Pendentes / Roadmap Futuro Seguro

- [ ] **Integração de Webhooks com Concessionárias:** Automatização da importação de tarifas por distribuidora para o módulo de ROI quando as APIs forem disponibilizadas.
- [ ] **Assinatura Digital Integrada:** Adição de fluxo DocuSign / Clicksign nativo diretamente no visualizador do comprador.
- [ ] **Geração de PDF no Servidor via Chromium Headless:** Avaliação de adoção de Puppeteer/Playwright headless no backend Rails para renderização assíncrona de alta tiragem.
