# Gap Analysis — Proposal Studio Avalia Solar 2026

**Data:** 14 de Outubro de 2026  
**Módulo:** `AB0-1-front/components/company-dashboard/proposals` & `AB0-1-back/app/controllers/api/v1/company_dashboard`  
**Referência:** Benchmark 77SOL (`Configurações > Definições de propostas`)  
**Status da Auditoria:** Concluída e Validada com persistência real  

---

## 1. Matriz Consolidada de Gaps (GAP-01 a GAP-15)

| ID | Achado AS-IS | Evidência Código | TO-BE Implementado / Aceite | Status | Prioridade |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **GAP-01** | `ProposalSettingsStudio.tsx` gravava preferências exclusivamente em `localStorage` com chave `avalia_solar_proposal_settings_${companyId}`. | `ProposalSettingsStudio.tsx` (linhas legadas 172–218). | Persistência Rails via tabela `company_proposal_settings`, endpoint `PATCH /api/v1/company_dashboard/proposal_settings`, isolamento estrito por tenant (`company_id`), RBAC com Pundit. `localStorage` não é fonte de verdade. | **RESOLVIDO** | P0 |
| **GAP-02** | Exemplos hardcoded de garantias fictícias (25 anos incondicionais), fotos de usinas de terceiros, custos e ROI simulados. | `ProposalSettingsStudio.tsx` (linhas legadas 106–169). | Remoção de dados simulados de produção. Valores padrão neutros, campos opcionais vazios ou configurados explicitamente pelo instalador titular. | **RESOLVIDO** | P0 |
| **GAP-03** | Pré-visualização expandida era um JSX/A4 ilustrativo estático simulando PDF. | `ProposalSettingsStudio.tsx` (linhas legadas 1434–1548). | Componente modular `PdfPreviewModal.tsx` com paginação técnica A4 real (páginas 1, 2 e 3), zoom interativo (70% a 150%), sem dados fictícios de terceiros. | **RESOLVIDO** | P0 |
| **GAP-04** | Miniaturas de modelos no drawer eram composições estáticas desalinhadas do template real. | `ProposalSettingsStudio.tsx` (linhas legadas 1165–1414). | Três templates originais de autoria própria (`modelo_1` Essencial Técnico, `modelo_2` Executivo Azul, `modelo_3` Técnico Solar) renderizados com fidelidade geométrica A4 em `PdfModelChooserDrawer.tsx`. | **RESOLVIDO** | P1 |
| **GAP-05** | UI de ROI, precificação, produtos e comissão exibia simulações soltas sem metodologia financeira validada. | `ProposalSettingsStudio.tsx` (linhas legadas 628–1129). | Tabela de Precificação por R$/kWp e fixo com persistência JSONB; módulo de ROI isolado e categorizado com transparência metodológica, sem alegações financeiras enganosas. | **RESOLVIDO** | P0/P2 |
| **GAP-06** | Duas experiências de configuração concorrentes (settings globais vs tabs de estúdio em `ProposalDetailsPane`). | `ProposalDetailsPane.tsx` (tabs legadas formulario, digital, template_pdf). | Camada unificada: `CompanyMarketplaceProposalsWorkspace.tsx` unifica navegação de nível superior (`Minhas propostas` \| `Modelos e configurações`). Defaults da empresa herdados nas versões de propostas. | **RESOLVIDO** | P1 |
| **GAP-07** | Workspace com 3 colunas renderizava chat P2P fixo na 3ª coluna desktop (≥1280px), drawer em tablet e view mobile, poluindo a tela. | `CompanyMarketplaceProposalsWorkspace.tsx` (linhas 458–600). | Remoção completa do chat fixo do workspace de propostas. Introdução de ação contextual `"Abrir conversa"` em `ProposalDetailsPane` direcionando para `/dashboard/inbox?conversation_id=...`. Sem exclusão de mensagens, API ou histórico. | **RESOLVIDO** | P1 |
| **GAP-08** | Wizard de 7 etapas de `ProposalWizardEditor.tsx` desconectado do template selecionado. | `ProposalWizardEditor.tsx` (linhas 327–1175). | As 7 etapas de criação permanecem preservadas, herdando o template padrão ativo salvo pela empresa. | **RESOLVIDO** | P1 |
| **GAP-09** | `ProposalDetailsPane` gravava termos em `terms` de `MarketplaceProposalVersion`, separado das settings da empresa. | `ProposalDetailsPane.tsx` (linhas 86–152). | Hierarquia estabelecida: `CompanyProposalSetting` define os padrões da empresa; ao criar ou publicar versão, grava-se snapshot imutável em `MarketplaceProposalVersion`. | **RESOLVIDO** | P0 |
| **GAP-10** | Limite de upload de PDF divergente: `ProposalDetailsPane` validava até 20MB enquanto backend e wizard limitavam a 10MB. | `ProposalDetailsPane.tsx` (linha 155), `ProposalDocumentService.rb` (10MB). | Limite padronizado em 10MB (`10 * 1024 * 1024` bytes) tanto na validação cliente quanto no feedback de erro amigável ao usuário. | **RESOLVIDO** | P1 |
| **GAP-11** | Drawer e menus com dimensões rígidas quebravam em viewports entre 320px e 1024px. | `ProposalSettingsStudio.tsx` (`w-64`, drawer 420px fixo sem overlay). | Arquitetura de 3 zonas adaptativas: Zona A (210–224px colapsável), Zona B (canvas flexível fluido), Zona C (drawer com overlay suave abaixo de 1280px e sheet full em PWA mobile). | **RESOLVIDO** | P1 |
| **GAP-12** | Testes de `ProposalSettingsStudio` validavam apenas strings básicas e não persistência ou isolamento. | `__tests__/components/ProposalSettingsStudio.test.tsx`. | Testes unitários atualizados com mock de `companyProposalSettingsApi`, validação de seleção de modelo, navegação em abas e ciclo de vida de salvamento backend. | **RESOLVIDO** | P0 |
| **GAP-13** | Tipografia poluída com excesso de ícones decorativos, labels minúsculos (10–11px) e cantos excessivamente arredondados. | `ProposalSettingsStudio.tsx`, `ProposalDetailsPane.tsx`. | Design System Avalia Solar: labels 12–14px legíveis, cantos `rounded-2xl` suaves, paleta institucional (azul `#0066FF`, grafite `#0F172A`, amarelo solar `#F6E85A` como acento). | **RESOLVIDO** | P2 |
| **GAP-14** | Referência 77SOL continha telas ricas de configuração sem equivalente próprio no Avalia Solar. | Screenshots do benchmark 77SOL fornecidos pelo usuário. | Paridade funcional integral implementada com autoria, identidade e arquitetura 100% originais do Avalia Solar. Zero cópia de código ou ativos de terceiros. | **RESOLVIDO** | P1 |
| **GAP-15** | Risco de vazamento de rascunhos de propostas ou configurações internas na área pública do comprador (`/review-dashboard/proposals`). | `MarketplaceProposalVersion` e controllers de buyer. | O comprador visualiza estritamente versões com status `published` e documentos oficiais autorizados. Dados de comissão interna e custos de instalação são filtrados na API. | **RESOLVIDO** | P0 |

---

## 2. Conclusão da Análise
Todos os 15 gaps identificados na auditoria inicial foram mapeados, corrigidos no código e verificados na suíte de testes. A aplicação agora opera com uma arquitetura coesa, segura e orientada a dados reais de produção.
