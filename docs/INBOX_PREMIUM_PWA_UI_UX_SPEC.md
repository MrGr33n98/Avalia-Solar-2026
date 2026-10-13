# Especificação de Design e UI/UX Premium PWA — Unified Inbox Enterprise

> **Documento:** Especificação Visual, Componentes e Responsividade (PWA)  
> **Sistema:** Avalia Solar 2026 (`AB0-1-front`)  
> **Padrão de Design:** Enterprise SaaS A+++, Clean Light Canvas (`#F8FAFC`), Card-in-Card 3 Colunas, Fidelidade Máxima à Referência Visual  
> **Status:** Implementado e Verificado (`AB0-1-front/app/dashboard/inbox/LiveInbox.tsx`)

---

## 1. Visão Geral da Interface & Canvas

A tela de **Mensagens / Inbox** em `app.avaliasolar.com.br/dashboard/inbox` foi desenhada e refinada seguindo os princípios de excelência do skill `ui-ux-pro-max`, reproduzindo com fidelidade pixel-perfect a referência visual aprovada:

- **Fundo da Página (Canvas):** Soft slate limpo (`#F8FAFC`), garantindo contraste harmonioso, sem áreas escuras pesadas no miolo da aplicação.
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

### 2.1 Top Header da Página
- **Título & Subtítulo:**
  - H1: `Mensagens` em `text-2xl font-black text-slate-900 tracking-tight`.
  - Subtítulo: *"Converse com compradores, gerencie oportunidades e acompanhe todo o histórico em um só lugar."* em `text-xs text-slate-500`.
- **Barra Global de Busca:**
  - Input arredondado com ícone de lupa: `"Buscar no Avalia Solar..."` em `bg-slate-50/70 border border-slate-200`.
- **Sino de Notificações:**
  - Botão quadrado arredondado com ícone de sino e badge circular vermelho no canto superior com o número `3`.
- **Controle de Som & Atualização:**
  - Botão de volume (som de novas mensagens com preferência salva em `localStorage`) e botão de refresh rápido.
- **Pílula de Perfil do Usuário:**
  - Avatar circular azul celeste com iniciais `FS` (Felipe Silva).
  - Nome: `Felipe Silva` (bold 12px).
  - Empresa: `Minha Empresa Solar` (10px cinza).
  - Ícone de ChevronDown para menu rápido de conta e alternância de empresa.

### 2.2 Sub-Header: Filtros & Ações
- **Pílulas de Filtro (Segmented Navigation):**
  - `Todas (12)`: Estado ativo com borda azul de 2px, fundo azul suave e texto azul negrito (`border-2 border-blue-600 bg-blue-50/70 text-blue-600 font-bold rounded-xl px-3.5 py-2 text-xs`).
  - `Não lidas (3)`: Borda cinza, fundo branco, com o contador `(3)` destacado em vermelho vibrante.
  - `Com propostas (5)`: Pílula branca com texto cinza escuro e contador `(5)`.
  - `Orçamentos (4)`: Pílula branca com texto cinza escuro e contador `(4)`.
  - `Arquivadas (2)`: Pílula branca com texto cinza escuro e contador `(2)`.
- **Busca de Conversas:**
  - Input `"Buscar conversas, empresas ou projetos..."` com ícone de lupa integrado e botão de limpar busca (`X`).
- **Botão de Filtro / Sliders:**
  - Botão quadrado com ícone `SlidersHorizontal` para ordenação por recência ou não lidas.
- **Botão de Ação Primária:**
  - `+ Nova conversa`: Botão azul sólido (`bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl px-4 py-2 text-xs`) que abre o diálogo de seleção de comprador/lead.

---

## 3. Master Card de 3 Colunas

```
┌─────────────────────────┬───────────────────────────────────────┬─────────────────────────┐
│       COLUNA 1          │               COLUNA 2                │        COLUNA 3         │
│       Conversas         │             Chat / Thread             │ Detalhes da Oportunidade│
│                         │                                       │                         │
│  [Mais recentes v]      │  [Avatar] Carlos Mendes  [Online agora] │ Status: [Aguardando v]  │
│                         │  [Tel] [Vídeo] [Ver perfil comprador] │                         │
│  • Carlos Mendes (2)    │ ───────────────────────────────────── │ Informações do cliente: │
│    Residência - SP      │         Hoje, 14 de junho de 2024     │ • Carlos Mendes         │
│  • Construtora Horiz.(1)│                                       │ • carlos.mendes@email...│
│    Comercial - Curitiba │  (Carlos): Olá! Gostaria de receber...│ • (11) 98765-4321       │
│  • Mariana Oliveira (3) │                                       │ • São Paulo - SP        │
│  • Grupo Delta [Proposta│  (Empresa): Olá Carlos! Claro... ✓✓   │                         │
│  • João Pereira [Orçam.]│                                       │ Projeto:                │
│  • TechSolar Energia    │  •• Carlos Mendes está digitando...   │ • Tipo: Residencial     │
│  • Atendimento IA (Bot) │ ───────────────────────────────────── │ • Consumo: ~500 kWh/mês │
│                         │  [Mensagem] [Anexar] [Modelos]        │ • Prazo: Até 3 meses    │
│                         │  [ Digite sua mensagem...           ] │                         │
│                         │  [Clip] [Img] [Emoji]           [✈]   │ Histórico (Stepper):    │
│                         │                                       │ • Solicitação recebida ✓│
│                         │                                       │ • Mensagem enviada •    │
│                         │                                       │ • Proposta enviada ○    │
│                         │                                       │                         │
│                         │                                       │ [+ Criar proposta]      │
└─────────────────────────┴───────────────────────────────────────┴─────────────────────────┘
```

### 3.1 Coluna 1: Lista de Conversas
- **Cabeçalho:** Título `Conversas` com seletor `Mais recentes v`.
- **Cards de Conversa:**
  - Avatar com iniciais ou foto, dot verde `Online agora` no canto inferior direito.
  - Título do participante (ex: *Carlos Mendes*, *Construtora Horizonte*).
  - Subtítulo do projeto/localização (ex: *Residência - São Paulo/SP*, *Projeto Comercial - Curitiba/PR*).
  - Prévia da última mensagem com truncamento suave.
  - Horário relativo no canto superior direito (`14:32`, `10:18`, `Ontem`, `12/06`).
  - Badges de destaque:
    - Badge numérico vermelho: Para mensagens não lidas (`2`, `1`).
    - Badge cinza: Para mensagens lidas/secundárias (`3`).
    - Tag `Proposta`: Pílula amarelo-âmbar (`bg-amber-100 text-amber-800`).
    - Tag `Orçamento`: Pílula verde-esmeralda (`bg-emerald-100 text-emerald-800`).
  - Item fixado / especial: `Atendimento IA` com ícone de robô em fundo azul claro, dot verde online e subtítulo *Assistente do Avalia Solar*.

### 3.2 Coluna 2: Área de Conversação Ativa
- **Cabeçalho da Thread:**
  - Avatar do contato com dot verde de status online.
  - Nome do comprador e subtítulo verde `Online agora`.
  - Botão de ligação telefônica / WhatsApp.
  - Botão de videochamada instantânea (Google Meet).
  - Botão pílula com borda azul: `Ver perfil do comprador`, abrindo modal completo com dados cadastrais e score de intenção.
- **Corpo de Mensagens:**
  - Separador de data centralizado: `Hoje, 14 de junho de 2024`.
  - **Mensagem Recebida (Comprador):** Balão cinza claro (`bg-slate-100 text-slate-800 rounded-2xl rounded-tl-none p-3.5 text-xs`), com avatar do contato ao lado esquerdo e timestamp `14:30`.
  - **Mensagem Enviada (Empresa):** Balão azul claro suave (`bg-[#EAF2FF] border border-blue-100 text-slate-900 rounded-2xl rounded-tr-none p-3.5 text-xs`), com timestamp `14:32` e duplo check azul `✓✓`.
  - **Indicador de Digitação:** Animação com três pontos azuis pulsantes e texto *"Carlos Mendes está digitando..."*.
- **Compositor de Mensagens:**
  - Abas superiores de ação rápida:
    - `Mensagem`: Aba ativa com fundo azul claro e ícone de chat.
    - `Anexar arquivo`: Dispara seletor de arquivos de até 15MB com upload verificado.
    - `Modelo de resposta`: Abre o `SavedRepliesModal` para inserção de respostas prontas comerciais e técnicas com 1 clique.
  - Caixa de texto: Textarea com cantos arredondados, sem redimensionamento indesejado, suporte a quebra de linha com `Shift+Enter` e envio com `Enter`.
  - Barra de ferramentas inferior:
    - Ícones à esquerda: `Clip` (anexo), `Imagem` (galeria/foto), `Emoji` (emoticons solares/rápidos).
    - Botão de envio à direita: Botão azul sólido com ícone de avião de papel `Send`.

### 3.3 Coluna 3: Detalhes da Oportunidade
- **Cabeçalho:** Título `Detalhes da oportunidade` com chevron para colapsar/expandir.
- **Status:** Rótulo `Status` e badge dropdown em tom âmbar suave `Aguardando proposta v`.
- **Seção 1: Informações do Cliente:**
  - Ícone de usuário em quadrado azul com título.
  - Linhas com ícones SVG vetoriais: Nome, E-mail, Telefone e Cidade/UF.
- **Seção 2: Projeto:**
  - Ícone de pasta/briefcase em quadrado azul com título.
  - Grid de 2 colunas com pares chave-valor:
    - Tipo: *Residencial*
    - Consumo estimado: *~ 500 kWh/mês*
    - Interesse: *Sistema completo*
    - Prazo: *Até 3 meses*
- **Seção 3: Histórico (Stepper Vertical):**
  - Timeline interativa com linha vertical conectora e círculos de status:
    1. *Solicitação recebida* (14/06/2024 - 14:30) — Círculo azul preenchido com checkmark branco `✓`.
    2. *Mensagem enviada* (14/06/2024 - 14:32) — Círculo azul ativo.
    3. *Proposta enviada* (Pendente) — Círculo cinza vazado.
    4. *Negociação* (-) — Círculo cinza vazado.
    5. *Concluído* (-) — Círculo cinza vazado.
- **CTA Principal Inferior:**
  - Botão full-width: `+ Criar proposta`, com link direto para o fluxo de emissão de propostas comerciais no dashboard.

---

## 4. Experiência Mobile & PWA

Na visualização mobile (`< 1024px`), a aplicação adota comportamento PWA-first idêntico à prévia ilustrada no mockup:

1. **Barra Superior Mobile:**
   - Logotipo `Avalia Solar PRO`.
   - Sino de notificações com badge circular vermelho `3`.
   - Avatar do usuário.
2. **Título & Filtros Mobile:**
   - Título `Mensagens` com ícone de busca.
   - Pílulas compactas com scroll horizontal: `Todas (12)`, `Não lidas (3)`, `Propostas (5)`.
3. **Lista de Conversas em Tela Cheia:**
   - Cards verticais com avatares, dots verdes de online, snippets de mensagens, tags de proposta/orçamento e badges numéricos.
4. **Transição para Chat Ativo:**
   - Ao tocar em qualquer conversa, a thread abre em tela cheia com botão `< Voltar` para a lista, header com status online e botão `Detalhes` que abre gaveta modal inferior com a ficha da oportunidade.
5. **Barra de Navegação Inferior PWA (Fixed Bottom Navigation):**
   - 5 itens fixados com touch-targets >= 44px:
     - `Início` (Home)
     - `Leads` (Target)
     - `Propostas` (FileText)
     - `Mensagens` (MessageSquare com badge vermelho `3` — estado ativo em azul)
     - `Mais` (Menu)

---

## 5. Garantia de Qualidade & Testes

- **Compilação TypeScript:** `npm --prefix AB0-1-front run typecheck` executado com **0 erros** (`tsc --noEmit` exit code 0).
- **Testes Unitários:** `UnifiedInbox.test.tsx` executado com **4/4 testes passando** no Jest.
- **Acessibilidade (a11y):** Labels em todos os campos de input, aria-labels em botões de ícone, contraste WCAG AA preservado, foco visível com ring azul.
