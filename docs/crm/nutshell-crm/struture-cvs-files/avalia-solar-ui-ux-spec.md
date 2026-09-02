# ESPECIFICAÇÃO COMPLETA DE DESIGN SYSTEM, INTERFACE (UI/UX) E FLUXOS
## CRM Avalia Solar (Engenharia Reversa Premium do Nutshell CRM Adaptado)
## Nível: Principal Product Designer / Staff UI/UX Engineer / Design System Architect

Este documento contém a especificação técnica visual e de experiência do usuário (UI/UX) completa para recriar o CRM adaptado para o setor de energia solar (**Avalia Solar**). A especificação foi extraída via engenharia reversa das telas e modais originais do benchmark de referência, preservando a alta densidade de informações, a ergonomia de uso intensivo de dados e aplicando melhorias focadas na operação de vendas de energia solar fotovoltaica.

---

## 1. SISTEMA VISUAL E TOKENS DE DESIGN (DESIGN SYSTEM)

Para atingir a sofisticação visual "SaaS Premium", adotamos uma paleta balanceada com alto contraste de leitura, superfícies bem delineadas por bordas sutis e tipografia moderna e altamente legível para dados numéricos.

### 1.1 Paleta de Cores (Tokens Semânticos)

A identidade visual original foi refinada para abraçar a temática solar da **Avalia Solar**, utilizando o azul-profundo para estabilidade corporativa e o laranja solar energético para conversões e chamadas de ação críticas.

| Categoria | Token CSS / Tailwind | Valor Hex | Uso na Interface |
| :--- | :--- | :--- | :--- |
| **Primary (Brand)** | `--color-primary-navy` | `#0c1a30` | Background da Sidebar principal, botões primários e cabeçalhos de seções. |
| **Secondary (Solar)** | `--color-secondary-solar`| `#ff6f00` | Destaques visuais, marcações de leads "Hot", botões de conversão e hover ativo. |
| **Accent / Success** | `--color-success-green` | `#38a169` | Status "Won" (Ganho), metas atingidas, etapas concluídas com sucesso. |
| **Background (App)** | `--color-bg-app` | `#f4f6f8` | Fundo principal da aplicação por trás dos painéis e grids. |
| **Background (Card)**| `--color-bg-surface` | `#ffffff` | Fundo de cartões de conteúdo, linhas de tabela, modais e barra lateral direita. |
| **Border / Divider** | `--color-border-subtle` | `#e2e8f0` | Divisórias de linha, grades de tabela e contornos de cards (1px solid). |
| **Text Primary** | `--color-text-main` | `#1a202c` | Títulos principais, texto em foco alto e rótulos de campos. |
| **Text Secondary** | `--color-text-muted` | `#718096` | Subtítulos, captions de timeline, descrições e placeholders. |

### 1.2 Tipografia

*   **Font Family Corporativa**: `Inter, system-ui, -apple-system, sans-serif` (Garante carregamento instantâneo, excelente espaçamento entre caracteres e excelente legibilidade de números em tabelas).
*   **Font Weights**:
    *   `Regular (400)`: Corpo de texto, valores de tabela, inputs de formulários.
    *   `Medium (500)`: Nomes de colunas, sub-guias de navegação, botões secundários.
    *   `Semibold (600)`: Nomes de empresas/contatos em tabelas e listas, títulos de cards.
    *   `Bold (700)`: Títulos de páginas, grandes métricas financeiras (valores do pipeline).
*   **Escala de Tamanhos (Font Sizes)**:
    *   `xs (12px)`: Badges, tags, legenda de timestamps na timeline.
    *   `sm (14px)`: Texto base de tabelas, inputs, textos do AppShell (Sidebar/Menus).
    *   `base (16px)`: Títulos de seções, textos de modais, corpo de anotações.
    *   `lg (18px)`: Títulos de cartões de KPI secundários.
    *   `xl (24px)`: Título principal das páginas de listagem.
    *   `2xl (32px)`: Métricas de destaque de faturamento no Dashboard.

### 1.3 Elevação e Bordas

*   **Borda Padrão**: `1px solid var(--color-border-subtle)` (`border border-slate-200`).
*   **Border Radius Scale**:
    *   `sm (4px)`: Checkboxes, badges de tags pequenas, inputs curtos.
    *   `md (6px)`: Botões, inputs padrões, avatares de usuário.
    *   `lg (8px)`: Cards de Kanban, linhas de tabela expansíveis, caixas de busca.
    *   `xl (12px)`: Modais flutuantes centrais e gavetas (Drawers) de tela cheia.
*   **Sombras (Shadows)**:
    *   `shadow-sm` (`0 1px 2px 0 rgba(0,0,0,0.05)`): Cards de Kanban internos.
    *   `shadow-md` (`0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)`): Linha ativa em hover de tabela e popovers de filtro.
    *   `shadow-xl` (`0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)`): Modais, gavetas e o editor de e-mail flutuante.

---

## 2. ARQUITETURA DA INTERFACE (APP SHELL)

A interface é construída em três zonas rígidas e persistentes para otimizar o fluxo de trabalho diário dos representantes de vendas de energia solar.

```
+---------------------------------------------------------------------------------------------------+
|  [Logo]  |  [Busca Global... Ctrl+K]  [+ Add New v]                 Questions?  [Notif] [Perfil v] | (TopBar - 56px)
+---------------------------------------------------------------------------------------------------+
|  (Sidebar|  PÁGINA ATIVA (ex: Todos os Leads)                                                      |
|   180px) |  +-----------------------------------------------------------------------------------+ |
|  Explore |  | FILTROS: [Responsável v] [Status v] [Funil v]   [Pesquisar leads...] | [Grid][Lista]  | |
|  Sales   |  +-----------------------------------------------------------------------------------+ |
|  Market. |  |                                                                                   | |
|  Engage. |  |                                                                                   | |
|  ------- |  |                              ÁREA CENTRAL DE CONTEÚDO                             | |
|  Compan. |  |                                                                                   | |
|  People  |  |                                                                                   | |
|  Leads   |  |                                                                                   | |
|  Reports |  |                                                                                   | |
|  ------- |  +-----------------------------------------------------------------------------------+ |
|  Nutshell|                                                                                        |
|  Settings|                                                                                        |
+---------------------------------------------------------------------------------------------------+
```

### 2.1 Barra Lateral Esquerda (Sidebar) - Largura: 180px (Filtro Escuro Premium)
*   **Background**: Azul-profundo (`#0c1a30`), criando forte contraste com a área de dados clara.
*   **Itens de Menu (Alt: 40px)**:
    *   Ícone SVG minimalista (20px) alinhado à esquerda + Texto de navegação (Inter, 14px, Medium).
    *   *Estado Padrão*: Texto em cinza-claro (`#a0aec0`) e ícone translúcido.
    *   *Estado Ativo*: Fundo com cor sólida primária selecionada, indicador lateral laranja solar no canto esquerdo, texto e ícone em branco puro (`#ffffff`).
    *   *Estado Hover*: Transição suave (`transition-colors duration-150`) para azul levemente mais claro (`#1a2a44`) com opacidade total no texto.

### 2.2 Barra Superior de Ações Globais (TopBar) - Altura: 56px (Branco Puro Estático)
*   **Posicionamento**: Fixado no topo (`sticky top-0 z-30`), com sombra sutil para sobrepor a rolagem do conteúdo.
*   **Componentes Principais**:
    1.  **Logo Avalia Solar (Canto Esquerdo - Alinhado à Sidebar)**: 180px de largura com fundo de marca integrado.
    2.  **Busca Global Inteligente (Alinhamento Central-Esquerdo)**:
        *   Input com ícone de lupa interna, largura estática de 280px. Placeholder: `"Search or press Ctrl K..."`.
        *   Ao pressionar `Ctrl+K`, exibe modal de busca instantânea (fuzzy search) de Leads, Contatos e Atividades.
    3.  **Botão "+ Add New" com Dropdown (Ao lado da Busca)**:
        *   Fundo azul-escuro com texto branco. Exibe um menu flutuante (Popover) ao clicar.
        *   *Opções do Menu*: Company, Person, Lead, Activity, Task, Import, Email campaign, SMS, Landing page, Form. Cada opção com ícone correspondente à esquerda. (Ver multimodal_1).
    4.  **Barra de Informações e Status (Canto Direito)**:
        *   Mensagem de suporte: `"Questions? Our team is online"`.
        *   Ícone de Notificações com badge vermelho numérico flutuante.
        *   Avatar do Usuário ativo (Felipe) com menu de configurações de conta.

---

## 3. ESPECIFICAÇÃO DE TELAS CHAVE

### 3.1 Sales Dashboard (Painel de Atividades e Métricas) - `multimodal_76`

Tabela de controle centralizada onde o vendedor inicia o seu dia de trabalho.

```
+-----------------------------------------------------------------------------------------+--------------------+
|  MÉTRICAS RÁPIDAS (METRICS - MONTH-TO-DATE)                                              | ATIVIDADES & TAREFAS|
|  +---------------------------+---------------------------+---------------------------+  | (Timeline Lateral  |
|  | New Leads                 | Open Leads                | Sales                     |  |  Largura: 280px)   |
|  | 0                         | US$ 88.4 k                | US$ 0                     |  |                    |
|  | Down 100%                 | Unchanged                 |                           |  | Hoje: Setembro 2   |
|  +---------------------------+---------------------------+---------------------------+  |                    |
|                                                                                         | [Nenhuma atividade |
|  LEADS MAIS QUENTES (HOT LEADS)                                                          |  agendada.         |
|  +-----------------------------------------------------------------------------------+  |  Botão: Agendar    |
|  | Aquora Purifiers [Sample]                                            US$ 31.000,00 |  |  atividade]        |
|  | Casey Yost [Sample]                                                               |  |                    |
|  +-----------------------------------------------------------------------------------+  | [Conectar agenda   |
|                                                                                         |  Google/Microsoft] |
+-----------------------------------------------------------------------------------------+--------------------+
```

*   **Metas e Métricas**: Cards de dados estatísticos (largura fluida, Grid de 3 colunas) que resumem o status do mês atual. Cada card exibe a métrica, a direção da tendência e a variação comparativa.
*   **Lista de Hot Leads**: Painel que exibe leads sinalizados com o ícone de chama solar ("Hot"). Exibe o nome da empresa, o contato principal e o valor financeiro alinhado à direita em verde.
*   **Sidebar Direita de Agenda**: Exibe tarefas e atividades integradas de forma cronológica, incentivando o fechamento de novas atividades com CTA proeminente: `Schedule an activity`.

### 3.2 Tabela de Empresas e Contatos (List Views) - `multimodal_13` e `multimodal_63`

Grids densas construídas com foco na manipulação rápida de grandes volumes de informações comerciais.

```
[X] [Avatar]  Nome do Contato/Empresa  | Último Contato | Endereço                   | Tipo de Conta | Tags
-----------------------------------------------------------------------------------------------------------
[ ] [AF] Aaron Fletcher [Sample]       | 17 minutos atrás| 99 Exchange Blvd, NY...    | Standard      | [Solar]
[ ] [CY] Casey Yost [Sample]           | 1 dia atrás     | 515 Rusk Ave, Houston...   | Standard      | [Quente]
```

*   **Barra de Ações Rápidas (Toolbar)**:
    *   Botão de Filtro "Assigned to" e "Company type" como botões dropdown inline.
    *   Barra de busca contextual: `"Search companies..."` ou `"Search people..."`.
    *   Botões de exportação e comunicação em lote: Botão de `Export` e `Email` que ficam ativos somente ao selecionar uma ou mais linhas da tabela por meio do checkbox lateral.
*   **Estrutura de Linha (Row Layout)**:
    *   Altura estática de 44px (`h-11`) por linha para manter alta densidade informativa.
    *   Colunas de Contato exibem o avatar em círculo do contato com as iniciais do nome e cores geradas de forma pseudo-aleatória (`--avatar-bg`), facilitando a identificação visual rápida.
    *   Hover de linha: Aplica cor de fundo cinza-ultra-claro (`#f7fafc`) com transição suave.
    *   Clique na linha: Abre diretamente a página com visão 360° da entidade selecionada.

### 3.3 Pipeline Kanban (Visão de Funil de Leads) - `multimodal_37`

Visualização clássica de Kanban para controle de oportunidades solares organizadas por etapas.

```
QUALIFY (1 Lead) | US$ 900          PITCH (2 Leads) | US$ 32.5k         CLOSE (1 Lead) | US$ 55k
+--------------------------------+  +--------------------------------+  +--------------------------------+
| EcoTech Solutions [Sample]     |  | NextCourt Techs [Sample]       |  | Skyline Technologies [Sample]  |
| US$ 900                        |  | US$ 1.5k                       |  | US$ 55k                        |
| Morgan Taylor [Sample]         |  | Aaron Fletcher [Sample]        |  | Jamie Lee [Sample]             |
| 1 mês                          |  | 3 meses                        |  | 8 meses                        |
+--------------------------------+  +--------------------------------+  +--------------------------------+
                                    | Aquora Purifiers [Sample] (Hot)|
                                    | US$ 31k                        |
                                    | Casey Yost [Sample]            |
                                    | 5 meses                        |
                                    +--------------------------------+
```

*   **Cabeçalho da Coluna**:
    *   Título da Etapa (`Qualify`, `Pitch`, `Close`) em negrito + contagem de leads ativos na coluna + valor somado de todos os leads daquela coluna em verde, fornecendo visibilidade financeira imediata do pipeline.
*   **Design dos Cartões de Negócio (Cards)**:
    *   Fundo branco, borda sutil de 1px, sombra suave.
    *   *Título*: Nome da Empresa ou Lead em tamanho semi-bold.
    *   *Conteúdo Interno*: Valor financeiro em destaque cinza + Contato Primário + Indicador de tempo em que o lead está parado naquela etapa (ex: `3 months`).
    *   *Acessórios*: Ícone de chama solar se o lead estiver marcado como quente e indicador de prioridade.
*   **Comportamento Drag & Drop**:
    *   Permite arrastar o cartão livremente entre colunas. Ao arrastar, o cartão fica com opacidade de 80%, rotação sutil de 1 grau e o alvo válido de soltura (dropzone) destaca sua borda em padrão tracejado laranja solar.

### 3.4 Visão Detalhada 360° (Lead / Pessoa / Empresa) - `multimodal_59` e `multimodal_17`

Layout de tela dividida em 3 painéis para manter todo o histórico contextualizado ao lado das ações rápidas.

```
+--------------------------------------------------------------------------------------------+
|  [Mapa de Localização Dinâmico no Topo - Altura: 140px]                                     |
+--------------------------------------------------------------------------------------------+
|  [Avatar] Quincy Herrold (VP of Customer Support @ Nutshell)                      [Atribuir]|
|  +---------------------------------------------------------------------------------------+ |
|  | [Log activity]  [Write note (Ativo)]  [Send email]  [Send text]  [Call contact]          | |
|  +---------------------------------------------------------------------------------------+ |
|  |  +---------------------------------------------------------------------------------+  | |
|  |  | Escreva uma anotação na timeline... @Mencione colegas, #Marque leads            |  | |
|  |  |                                                                                 |  | |
|  |  | [ ] Fixar nota no topo                                        [Salvar nota]     |  | |
|  |  +---------------------------------------------------------------------------------+  | |
|  |                                                                                       | |
|  |  TIMELINE UNIFICADA (Histórico Cronológico)                                           | |
|  |  - 11:54 AM: Nutshell registrou atividade de ligação.                                | |
|  |  - 11:54 AM: Notas criadas por Felipe.                                                | |
|  |  - 11:54 AM: Usuário Quincy Herrold foi adicionado ao sistema.                       | |
|  +---------------------------------------------------------------------------------------+ |
+--------------------------------------------------------------------------------------------+
```

#### Painel Central (65% da largura): Timeline de Atividades e Histórico
*   **Barra de Ações Rápidas de Engajamento**:
    *   Botões em abas horizontais: `Log activity` (registrar ligação/reunião), `Write note` (campo ativo padrão de notas), `Send email` (abertura de modal de e-mail flutuante), `Send text` (envio de SMS) e `Call contact`.
*   **Histórico Cronológico Reverso (Timeline)**:
    *   Cards de eventos com ícone descritivo de cada ação à esquerda (telefone para ligações, balão de texto para notas, envelope para emails e engrenagem para logs do sistema).
    *   Cada item exibe o autor da ação, a hora e o conteúdo expandido de forma clara com excelente espaçamento interno.

#### Painel Lateral Direito (35% da largura): Dados Cadastrais e Campos Customizados
*   **Seções Colapsáveis (Accordion Cards)**:
    1.  **Summary**: Territorialidade, responsável, tempo do último contato e tags do contato.
    2.  **Contact Info**: Formulário para adicionar telefones, e-mails comerciais ou perfis sociais.
    3.  **Leads Relacionados**: Exibe a lista de oportunidades criadas com o status (aberto/fechado).
    4.  **Custom Fields (Campos Customizados)**: Seção dedicada para o dimensionamento técnico solar (ver integração de banco de dados abaixo).

---

## 4. ESPECIFICAÇÃO DE COMPONENTES INTERATIVOS (MODAIS)

### 4.1 Modal "Add Lead" (Criação de Oportunidade) - `multimodal_34` e `multimodal_33`

Modal de sobreposição central (`fixed inset-0 bg-black/50 backdrop-blur-sm z-50`), projetado para entrada rápida de novos dados.

*   **Estrutura de Formulário**:
    1.  **Campos Principais**:
        *   `Lead name` (Input texto grande).
        *   `Pipeline` (Dropdown com seleção de funil e toggle opcional `"This lead is hot 🚀"`).
        *   `Assignee` (Dropdown de seleção com busca automática e avatar dos vendedores do CRM).
        *   `Anticipated closed date` (Seletor de data estático).
    2.  **Seção de Receita / Orçamento (Grid Multifuncional)**:
        *   Seletor de moeda (Padrão: BRL R$ ou USD US$) + Input numérico de receita estimada.
        *   Seletor de Produto comercializado + Quantidade (`Qty`) + Preço Unitário (`Price`).
    3.  **Seção de Relacionamento**:
        *   Botões de ação direta: `+ Add a company` e `+ Add a person`. Ao clicar, exibe inputs de autocomplete dinâmico buscando dados existentes no banco ou permitindo a criação inline instantânea.
    4.  **Seção de Origem e Tags**:
        *   `Sources` (Dropdown de lista fechada: `Cold Call`, `Conference`, `Meeting`, `Referral`, `Web Signup`).
        *   `Tags` (Input estilo chip-tag que insere nova tag ao pressionar Enter).
*   **Botões de Rodapé**:
    *   `Cancel` (Alinhado à esquerda em texto cinza).
    *   `Create lead` (Botão proeminente alinhado à direita em verde success brilhante com efeito de hover suave).

### 4.2 Modal "Email Composer" (Editor de E-mail Integrado) - `multimodal_9`

Uma janela estilo gaveta flutuante ancorada no canto inferior direito, permitindo que o vendedor navegue no CRM enquanto digita a comunicação.

*   **Design Shell**:
    *   Dimensões fixas: `Width: 640px`, `Height: 520px` com cantos superiores arredondados (`rounded-t-lg`), sombra pesada (`shadow-2xl`) e barra de título superior para minimizar ou fechar.
*   **Painel Esquerdo (Lista de Templates - 30% da largura)**:
    *   Barra de busca de templates (`"Search templates..."`) + Lista de templates criados em rolagem interna. Permite clicar e carregar o texto imediatamente no corpo do e-mail.
*   **Painel Direito (Editor Rich Text - 70% da largura)**:
    *   Campos de Remetente (`From`) e Destinatário (`To` com suporte a tags de chips de múltiplos contatos e botão inline `Cc/Bcc`).
    *   Campo de Assunto (`Subject`).
    *   Área de texto com editor WYSIWYG básico na base: Ícones de formatação (Negrito, Itálico, Sublinhado, Lista, Links, Imagem e Clipes de Anexos).
    *   Checkbox na barra de ações: `[ ] Save as template after sending` para automatizar o reaproveitamento de mensagens.
    *   Botão de Envio: Azul com dropdown acoplado para agendar o envio para depois (`Send later`).

---

## 5. ADAPTAÇÃO ESPECIALIZADA: ECOSSISTEMA AVALIA SOLAR

Para transformar o benchmark genérico de CRM em uma máquina de vendas especializada em **Energia Solar Fotovoltaica**, adicionamos componentes e regras de negócio para as necessidades da **Avalia Solar**.

### 5.1 Seção de Dimensionamento Técnico (Sidebar do Lead)
Sempre que um lead estiver na etapa de **Qualificação** ou **Apresentação de Proposta (Pitch)**, um card exclusivo de Dimensionamento Solar é exibido no painel lateral direito:

*   **Campos de Entrada Técnica (Sincronizados com a tabela `solar_projects`)**:
    *   *Consumo Mensal Médio (kWh)*: Campo numérico obrigatório.
    *   *Valor Médio da Fatura (R$)*: Determina o potencial financeiro do cliente.
    *   *Tipo de Telhado*: Dropdown estruturado (`Telha Cerâmica`, `Metálico`, `Laje`, `Fibrocimento`, `Solo`).
    *   *Orientação do Telhado / Sombreamento*: Avaliação rápida de perdas de eficiência (`Sem sombreamento`, `Sombreamento Baixo`, `Médio`, `Severo`).
*   **Cálculo Automatizado Inline (Gatilho Frontend/API)**:
    *   Ao inserir o consumo mensal, o sistema estima instantaneamente a **Potência Necessária do Gerador (kWp)** e a **Quantidade Estimada de Painéis Solares (Placas)**, exibindo de forma proeminente com um card visual de "Recomendação Solar".

### 5.2 Seção de Propostas e Orçamentos (Quotes) - `multimodal_75`
*   **Geração de Proposta Solar**:
    *   O botão secundário de ações rápidas permite gerar um PDF profissional de proposta comercial com base na potência dimensionada.
    *   A tela de "Quotes" exibe um gráfico de barras coloridas mostrando as propostas geradas nos últimos 30 dias com os status: **Draft (Rascunho)**, **Sent (Enviado)**, **Accepted (Aceito/Fechado)** e **Overdue (Atrasado)**.
    *   Garante rastreabilidade completa das propostas de engenharia ligadas ao lead comercial.

---

## 6. MATRIZ DE ESTADOS E COMPORTAMENTO (MICROINTERAÇÕES)

| Componente | Ação do Usuário | Estado Visual Antes | Resposta Visual do Sistema (UI Response) | Alteração de Dados (BD/API) |
| :--- | :--- | :--- | :--- | :--- |
| **Linha de Tabela** | Hover do mouse | Fundo Branco (`#ffffff`) | Transiciona o fundo para Cinza Claro (`#f7fafc`), muda o cursor para pointer e exibe botão de ações rápidas escondido. | Nenhuma (Apenas visual) |
| **Cartão Kanban** | Iniciar Drag | Posição estática na coluna | Opacidade cai para 80%, rotação leve (1°), cursor muda para `grabbing`. | Nenhuma até a soltura |
| **Coluna Kanban** | Hover de arrasto (Dragover) | Aparência padrão | O fundo da coluna alvo ganha bordas tracejadas laranja e overlay translúcido cinza de destino válido. | Nenhuma |
| **Cartão Kanban** | Soltura (Drop) na coluna seguinte | Em arrasto livre | O cartão se fixa na nova coluna, pisca brevemente em verde claro e a soma do topo da coluna é atualizada em tempo real com efeito de transição numérica. | Envia requisição `PATCH /api/leads/:id` com novo `stage_id`. |
| **Input de Formulário** | Foco (Focus) | Borda fina cinza (`border-slate-200`) | Borda ganha destaque azul ou laranja de 2px e sombra suave de anel interno. | Nenhuma |
| **Timeline Note** | Clicar em "Save note" | Editor com texto digitado | Campo do editor é limpo, um novo card de nota animado surge no topo da timeline com efeito fade-in de cima para baixo. | Envia `POST /api/notes` com `notable_id` e conteúdo. |
| **Botão "+ Add Lead"**| Clicar no botão | Modal fechado | Abre o modal central com animação de escala suave (`scale-95` para `scale-100`) e foco automático (`autofocus`) no primeiro campo (`Lead name`). | Nenhuma |
