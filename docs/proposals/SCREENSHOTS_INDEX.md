# Índice de Telas e Mapeamento Visual — Proposal Studio Enterprise

**Data:** 14 de Outubro de 2026  
**Referência Comparativa:** Benchmark 77SOL (`media_1791953267857.jpg`) vs. Implementação Original Avalia Solar  

---

## 1. Mapeamento Visual dos Componentes e Telas

| Tela / Visão | Referência Benchmark (77SOL) | Implementação Original Avalia Solar | Componente Responsável |
| :--- | :--- | :--- | :--- |
| **Topbar & Abas Globais** | Título `Configurações` com abas `Empresa` e `Definições de propostas`. | Topbar institucional com H1 `Configurações`, badge da empresa ativa (`Love Solar Teste`) e abas `Empresa` \| `Definições de propostas`. | `ProposalSettingsStudio.tsx` |
| **Menu Secundário (Zona A)** | Árvore com Geral (Mão de obra, Condições de pagamento), Proposta PDF (Configurações), Proposta Digital (Configurações, Cores, ROI, Produtos, Comissão). | Submenu lateral compacto (210–224px) com acordeões colapsáveis e ícones sutis da biblioteca Lucide. | `settings/SettingsSidebarNav.tsx` |
| **Canvas Central (Zona B)** | Banner azul para Definir Modelo, cards de Cores e Capa, tabela de seções com Switch + Label + Editar. | Layout fluido em cartão branco com sombras discretas, switch acessível, banner azul institucional com indicação do modelo ativo. | `ProposalSettingsStudio.tsx` |
| **Drawer de Modelos (Zona C)** | Drawer lateral com 3 cards de modelos, zoom modal e botão Salvar modelo padrão. | Drawer lateral deslizante (380–420px) com miniaturas dos 3 modelos autorais (`modelo_1`, `modelo_2`, `modelo_3`), zoom técnico e botão de persistência Rails. | `settings/PdfModelChooserDrawer.tsx` |
| **Pré-visualização A4 Expandida** | Modal amplo com visualização de documento. | Modal centrado com proporção geométrica A4 (`aspect-[1/1.414]`), controles de zoom de 70% a 150% e paginação em 3 páginas. | `settings/PdfPreviewModal.tsx` |
| **Tabela de Precificação** | Tabela com Status, Custo, Preço/kWp, De, Até, Cálculo, Ações. | Tabela responsiva com switches de status, formatação monetária R$/kWp, badges de tipo de cálculo e botão de exclusão. | `ProposalSettingsStudio.tsx` |
| **Condições de Pagamento** | Lista com switches e badges para Boleto, Cartão, Financiamento, Transferência. | Lista de formas de pagamento com controle de parcelamento, desconto à vista configurável e drawer de edição. | `ProposalSettingsStudio.tsx` & `settings/SectionEditorDrawer.tsx` |
| **Workspace de Propostas** | Três colunas fixas com chat permanente poluindo o fluxo de vendas. | **Design clean Avalia Solar:** 2 colunas amplas para lista e detalhes. Chat fixo removido e substituído por botão contextual `"Abrir conversa"` para a Inbox. | `CompanyMarketplaceProposalsWorkspace.tsx` & `ProposalDetailsPane.tsx` |

---

## 2. Diferenciais Éticos e Técnicos da Solução
- **Zero Cópia de Código ou Marcas:** Todos os componentes foram escritos do zero em TypeScript e Tailwind CSS, sem importar estilos, classes ou scripts da referência.
- **Fidelidade Funcional A+++:** Toda a ergonomia e facilidade de configuração foram atingidas com identidade visual própria do Avalia Solar.
- **Transparência Comercial:** Remoção de dados fictícios em conformidade com as diretrizes do projeto.
