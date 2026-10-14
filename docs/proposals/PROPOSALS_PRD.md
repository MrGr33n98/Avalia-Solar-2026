# Product Requirements Document (PRD) — Avalia Solar Proposal Studio Enterprise

**Versão:** 2.0.0  
**Data:** 14 de Outubro de 2026  
**Status:** Aprovado e Implementado  
**Público-Alvo:** Integradores Solares, Instaladoras Credenciadas, Equipes de Vendas e Engenharia  

---

## 1. Visão do Produto
O **Proposal Studio Enterprise** do Avalia Solar transforma a gestão de orçamentos fotovoltaicos em uma central de propostas de alta conversão, combinando facilidade de configuração institucional, modelos técnicos profissionais e preservação estrita de integridade entre propostas enviadas e padrões corporativos.

---

## 2. Personas e Casos de Uso
1. **Engenheiro/Orçamentista:**
   - Define faixas de custos de mão de obra (R$/kWp e fixo por homologação).
   - Configura parâmetros de equipamentos homologados e termos de garantia válidos.
2. **Gestor Comercial/Diretor:**
   - Personaliza a identidade visual da empresa (cores primária, secundária e acento).
   - Escolhe o modelo padrão de PDF (`modelo_1`, `modelo_2` ou `modelo_3`).
   - Define condições comerciais (Boleto, Cartão, Transferência, Financiamento).
3. **Vendedor/Consultor de Campo:**
   - Utiliza as 7 etapas do Wizard para gerar orçamentos específicos para leads qualificados.
   - Pré-visualiza em tempo real o PDF final gerado com paginação A4.
   - Publica a proposta oficial para o comprador e acessa a conversa com o cliente via Inbox.
4. **Comprador Final (Consumidor Solar):**
   - Recebe proposta com link seguro e imutável.
   - Visualiza PDF limpo, responsivo e sem adulterações pós-envio.

---

## 3. Requisitos Funcionais

### 3.1 Navegação de Alto Nível
- A aba de Propostas no painel da empresa deve permitir alternância instantânea entre:
  - **Minhas propostas:** Pesquisa, filtros de status, listagem, detalhes de versão, lifecycle e auditoria.
  - **Modelos e configurações:** Painel corporativo com seções Geral, Proposta PDF e Proposta Digital.

### 3.2 Isolamento de Comunicação (Sem Chat Fixo)
- O workspace de propostas **não exibe chat permanentemente** na terceira coluna desktop ou em gavetas mobile.
- Contexto de mensagens é acessado via link/botão `"Abrir conversa"` em `ProposalDetailsPane`, navegando no mesmo separador para `/dashboard/inbox?conversation_id=<id>`.
- Caso a proposta não possua conversa ativa com o lead, exibe-se estado desabilitado (`"Sem conversa vinculada"`).

### 3.3 Biblioteca de Modelos PDF Originais
- Disponibilização de 3 modelos de autoria exclusiva:
  1. **Modelo 1 (Essencial Técnico):** Visual sóbrio, tabular, focado em clareza técnica e custos unitários.
  2. **Modelo 2 (Executivo Azul):** Capa nobre com destaque para a marca do integrador e dados executivos.
  3. **Modelo 3 (Técnico Solar):** Layout moderno com fotos de usinas, garantias detalhadas e cronograma.
- Drawer lateral direito com prévia em miniatura fiel, seleção com rádio/check e botão "Salvar como modelo padrão".
- Modal de ampliação de prévia em formato A4, com controle de zoom (70% a 150%) e paginação.

### 3.4 Configurações de Seções e Componentes
- Linhas compactas com Switch + Nome da Seção + Ação Editar.
- Edição em Drawer contextual à direita sem perder o scroll ou contexto da página:
  - **Sobre a empresa:** Texto institucional controlado.
  - **Imagens de obras:** Galeria de projetos reais executados.
  - **Título da proposta:** Customização do cabeçalho da proposta.
  - **Garantias:** Especificação de inversores, módulos e mão de obra.
  - **Termos e condições:** Cláusulas contratuais da instaladora.
  - **Cronograma:** Prazos e marcos de execução da obra.

### 3.5 Persistência Backend e Multi-Tenant
- Tabela `company_proposal_settings` vinculada a `Company` com campos JSONB.
- Endpoint RESTful seguro `Api::V1::CompanyDashboard::ProposalSettingsController` protegido por Pundit.
- Isolamento estrito entre empresas: dados de uma instaladora jamais vazam para concorrentes.

---

## 4. Requisitos Não Funcionais
- **Responsividade PWA:** Totalmente adaptado para 320px até 1920px+ sem overflow horizontal.
- **Performance:** Carregamento inicial do estúdio < 200ms com UI otimista.
- **Acessibilidade:** Padrões WCAG 2.1 AA, labels de 12–14px, contraste mínimo 4.5:1, navegação por teclado e foco visível.
- **Segurança e Imutabilidade:** Snapshot congelado de templates nas versões de propostas publicadas. Modificações em configurações padrão não alteram propostas já enviadas.
