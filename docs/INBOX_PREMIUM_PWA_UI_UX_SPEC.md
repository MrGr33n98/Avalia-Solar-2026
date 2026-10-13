# Especificação de Design e UI/UX Premium PWA — Unified Inbox Enterprise

> **Documento:** Especificação Visual, Componentes e Responsividade (PWA)  
> **Sistema:** Avalia Solar 2026 (`AB0-1-front`)  
> **Padrão de Design:** Enterprise SaaS A+++, Clean Light Canvas (`#F8FAFC`), Card-in-Card 3 Colunas, Fidelidade Máxima à Referência Visual  
> **Status:** Implementado e Verificado (`AB0-1-front/app/dashboard/inbox/LiveInbox.tsx`)  
> **Integridade de Dados:** 100% Dados Reais da API — Zero dados mockados/inventados.

---

## 1. Visão Geral da Interface & Canvas

A tela de **Mensagens / Inbox** em `app.avaliasolar.com.br/dashboard/inbox` foi desenhada e refinada seguindo os princípios de excelência do skill `ui-ux-pro-max`, reproduzindo com fidelidade pixel-perfect a referência visual aprovada:

- **Fundo da Página (Canvas):** Soft slate limpo (`#F8FAFC`), garantindo contraste harmonioso, sem áreas escuras pesadas no miolo da aplicação.
- **Navbar Canônica Mantida:** A barra de navegação superior padrão do Dashboard (`DashboardToolbar`) é integralmente mantida no topo:
  - Seletor de empresa ativa (`CompanySwitcher` — ex: `WEG ↕`).
  - Menu de comandos globais (`CommandMenu` — *"Buscar no dashboard... ⌘ K"*).
  - Alternador de tema (`ThemeToggle` — *"☼ Claro"*).
  - Central de suporte (*"? Ajuda"*).
  - Avatar fotográfico do usuário autenticado.
- **Master Container:** Card unificado com cantos arredondados generosos (`rounded-2xl border border-slate-200/90 bg-white shadow-sm overflow-hidden`) contendo as 3 colunas funcionais.
- **Tipografia:** `Plus Jakarta Sans` / System Font com hierarquia clara de tamanhos (24px para título H1, 14px para cabeçalhos e nomes, 12px para corpo e metadados, 10px para badges e timestamps).
- **Paleta de Cores Primária:**
  - Azul Institucional Primário: `#2563EB` (Tailwind `blue-600`), hover `#1D4ED8` (`blue-700`).
  - Azul Claro Suave (Balões de saída e abas ativas): `#EAF2FF` com borda sutil `#DBEAFE`.
  - Cinza Claro (Balões de entrada do comprador): `#F1F5F9` (Slate 100).
  - Verde Sucesso / Online: `#10B981` (Emerald 500) com anel branco.
  - Amarelo Oportunidade / Proposta: `#FEF3C7` (Amber 100) / `#92400E` (Amber 800).
  - Vermelho Alerta / Não Lidas: `#EF4444` (Red 500).

---

## 2. Componentes Estruturais

### 2.1 Top Header da Página (Abaixo do DashboardToolbar)
- **Título & Subtítulo:**
  - H1: `Mensagens` em `text-2xl font-black text-slate-900 tracking-tight`.
  - Subtítulo: *"Converse com compradores, gerencie oportunidades e acompanhe todo o histórico em um só lugar."* em `text-xs text-slate-500`.
- **Controles de Produtividade:**
  - Botão de volume (som de novas mensagens em tempo real com preferência salva em `localStorage`).
  - Botão de atualização rápida (`RefreshCw`) conectado à API unificada.

### 2.2 Sub-Header: Filtros Reais & Ações
- **Pílulas de Filtro (Segmented Navigation com Dados Reais):**
  - `Todas ({counts.all})`: Estado ativo com borda azul de 2px, fundo azul suave e texto azul negrito.
  - `Não lidas ({counts.unread})`: Borda cinza, fundo branco, com o contador destacado em vermelho vibrante caso > 0.
  - `Aguardando resposta ({counts.waiting_reply})`: Pílula branca com texto cinza escuro e contador real.
  - `Arquivadas ({counts.archived})`: Pílula branca com texto cinza escuro e contador real.
- **Busca de Conversas:**
  - Input `"Buscar conversas, empresas ou projetos..."` com debounce de 300ms e botão de limpar busca (`X`).
- **Botão de Filtro / Sliders:**
  - Botão quadrado com ícone `SlidersHorizontal` para alternar ordenação por recência ou não lidas.
- **Botão de Ação Primária:**
  - `+ Nova conversa`: Botão azul sólido (`bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl px-4 py-2 text-xs`) que abre o diálogo de seleção de comprador/lead.

---

## 3. Master Card de 3 Colunas (100% Dados Reais da API)

### 3.1 Coluna 1: Lista de Conversas
- **Cabeçalho:** Título `Conversas` com contador real de itens e seletor segmentado de canal (`Todos`, `Compradores`, `Chat IA`).
- **Cards de Conversa com Foto Real do Participante:**
  - Se `item.participant.avatar_url` estiver disponível, renderiza a imagem real da foto do usuário com `object-cover` e anel de borda. Fallback gracioso para iniciais ou ícone de bot IA caso não haja foto.
  - Dot verde de status online no canto inferior direito do avatar.
  - Nome real do comprador ou visitante IA.
  - Localidade real do lead (Cidade/UF) ou canal.
  - Prévia da última mensagem com identificação de remetente (*"Você: "* quando enviado pela empresa).
  - Horário relativo no canto superior direito (`14:32`, `10:18`, `Ontem`, `12/06`).
  - Badges reais:
    - Badge numérico vermelho: Para contagem de mensagens não lidas reais (`item.unread_count`).
    - Tag `Proposta`: Pílula âmbar quando há `marketplace_proposal_reference`.
- **Estado Vazio Real:** Quando não há conversas no filtro, renderiza estado vazio informativo com botão de atualizar lista (sem inventar conversas fictícias).

### 3.2 Coluna 2: Área de Conversação Ativa
- **Cabeçalho da Thread:**
  - Foto do participante em tamanho real no cabeçalho com dot verde `Online agora`.
  - Nome do comprador e tag de canal (`Comprador` ou `Chat IA`).
  - Botão de ligação telefônica / WhatsApp direto (quando telefone estiver cadastrado).
  - Botão de videochamada instantânea (Google Meet).
  - Botão pílula `Ver perfil`, abrindo modal com dados cadastrais reais e score de intenção.
- **Corpo de Mensagens Reais:**
  - Mensagens carregadas diretamente de `conversationsApi.getMessages` (P2P) ou `inboxApi.messages` (IA).
  - Avatar fotográfico real do comprador ao lado de cada balão recebido.
  - Balão do comprador em cinza claro (`#F1F5F9`).
  - Balão da empresa em azul suave (`#EAF2FF`) com duplo check azul `✓✓`.
  - Suporte completo a anexos verificados no Active Storage.
- **Compositor de Mensagens:**
  - Abas de ação rápida:
    - `Mensagem`: Aba ativa com fundo azul claro.
    - `Anexar arquivo`: Dispara seletor de arquivos de até 15MB com upload verificado.
    - `Modelo de resposta`: Abre o `SavedRepliesModal` para inserção de respostas prontas comerciais e técnicas com 1 clique.
  - Textarea com suporte a envio com `Enter` (e nova linha com `Shift+Enter`).
  - Toolbar com botões de anexo, imagem, emoji e botão de envio em azul sólido com ícone `Send`.

### 3.3 Coluna 3: Detalhes da Oportunidade
- **Cabeçalho:** Título `Detalhes da oportunidade` com chevron para colapsar/expandir.
- **Status:** Status real da conversa (`Aguardando proposta`, `Resolvido`).
- **Seção 1: Informações do Cliente:**
  - Dados reais obtidos da API: Nome, E-mail, Telefone e Cidade/UF.
- **Seção 2: Projeto:**
  - Dados reais do lead: Solução/tipo, valor da fatura de energia, proposta vinculada e temperatura/prazo.
- **Seção 3: Propostas Vinculadas:**
  - Lista de propostas reais vinculadas (`linked_proposals`) com referência, status, valor em BRL, potência em kWp e link direto para o dashboard de propostas.
- **Seção 4: Controles de Atendimento:**
  - P2P: Botão para resolver ou reabrir negociação.
  - IA: Botões para assumir atendimento humano (`takeover`) ou devolver ao bot assistente.
- **CTA Principal:**
  - Botão `+ Criar proposta`, com link direto para o fluxo de emissão de propostas comerciais.

---

## 4. Garantia de Qualidade & Testes

- **Compilação TypeScript:** `npm --prefix AB0-1-front run typecheck` executado com **0 erros** (`tsc --noEmit` exit code 0).
- **Testes Unitários:** `UnifiedInbox.test.tsx` executado com **4/4 testes verdes** no Jest.
- **Regra de Não Invenção:** Nenhuma métrica, usuário, empresa ou avaliação fake inserida; 100% integrado ao backend Rails multi-tenant.
