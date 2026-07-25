## 22. Ajuste do Widget de IA para abrir o Wizard Mobile

### 22.1. Causa raiz
- O clique no FAB mobile do MobiVolt AI era tratado em `components/chat/ChatWidget.tsx` por `handleToggle`.
- Nesse fluxo, o mobile abria apenas `showCompactHelp`, um painel compacto independente, e nao disparava o evento `open-quote-wizard`.
- O modal principal do wizard em `components/QuoteWizardModal.tsx` escuta esse evento em `handleOpenRequest`, portanto o estado visual esperado nunca era aplicado quando o usuario tocava no widget de IA em telas pequenas.

### 22.2. Alteracao implementada
- O handler mobile do FAB agora abre diretamente o `QuoteWizardModal` via `openQuoteWizard({ source: 'mobivolt-mobile-fab' })`.
- O `QuoteWizardModal` recebeu ajuste de container mobile para assumir o comportamento de modal compacto ancorado na base da tela, com `safe-area`, cabecalho compacto, conteudo rolavel e rodape fixo.
- As etapas mantiveram a logica existente de negocio, mas passaram a usar hierarquia visual mais forte no mobile para corresponder ao estado esperado do questionario.

### 22.3. Validacao esperada
- Tocar no widget de IA em mobile deve abrir imediatamente o wizard.
- O wizard nao deve depender do painel compacto anterior para aparecer.
- O modal deve respeitar a largura disponivel, nao colidir com a navegacao inferior e manter a acao principal sempre visivel no rodape.

## 21. Visão "OLX do Mercado Solar" (Evolução C2B)

A visão do Avalia Solar é ser o "OLX do mercado de energia solar e mobilidade elétrica". Isso significa transformar o aplicativo de um simples diretório de empresas para um **ecossistema transacional de negociação direta** entre consumidor e fornecedor.

### 21.1. O que muda na UX da Jornada do Usuário?
- **Foco na Negociação P2P**: O botão "Solicitar Orçamento" não é apenas um formulário que envia um e-mail; ele abre um **Chat Direto (P2P)** com a empresa, criando uma "Sala de Negociação".
- **Pipeline de Orçamentos (Consumidor)**: O usuário terá uma aba "Minhas Negociações" onde vê todos os orçamentos solicitados em formato de cards (ex: "Em andamento", "Aguardando Resposta", "Proposta Recebida").
- **Dashboard CRM (Empresa)**: A empresa terá um pipeline visual (Kanban ou Lista de Status) no seu mobile: "Novos Leads", "Em negociação", "Visita Agendada", "Negócio Fechado".
- **Avaliação Friccionless**: A avaliação é a moeda do marketplace. O compartilhamento do QR Code deve ser acessível a um clique para o instalador apresentar ao fim da obra.

### 21.2. Especificação: Mensageria P2P e Negociação
**Objetivo**: Permitir que o cliente converse com a empresa, envie fotos do telhado/conta de luz e receba propostas em PDF direto pelo app.

**Requisitos Mínimos**:
- Histórico de mensagens persistente (ActionCable + REST).
- Tipos de mensagens suportadas: Texto, Imagem (foto da conta/telhado), Arquivo (Proposta PDF) e Sistema ("Empresa X enviou uma proposta").
- Indicador de digitação e recibos de leitura (Read Receipts).
- Push Notifications para novas mensagens.
- **Componentes Necessários**: `ChatListScreen`, `ChatRoomScreen`, `MessageBubble`, `AttachmentPreview`, `ProposalCard`, `ChatInputBar`.

**Entregáveis**:
- Tela de lista de conversas unificada (cliente e empresa).
- Tela de sala de chat P2P.
- Integração com backend para envio e recebimento via ActionCable.

**Testes E2E**:
- Cliente envia mensagem -> Empresa recebe push e vê no topo da lista.
- Cliente anexa foto da conta de luz -> Foto carrega no chat com preview.
- Empresa clica em "Gerar Proposta" -> Card de proposta aparece no chat do cliente.
- Teste offline: Mensagem fica com relógio e é enviada ao recuperar conexão.

### 21.3. Especificação: Compartilhamento de QR Code (Dashboard Empresa)
**Objetivo**: Fornecer uma ferramenta de marketing de guerrilha para a empresa captar avaliações no momento de maior satisfação do cliente (término da instalação).

**Requisitos Mínimos**:
- Acesso rápido na Home do Dashboard da Empresa: "Gerar QR Code de Avaliação".
- Geração de QR code dinâmico que embuti a URL: `avaliasolar://review/company/[slug]?source=qr&campaign=in_person`.
- Tela para a empresa visualizar o QR code em tela cheia (brilho no máximo para facilitar leitura da câmera do cliente).
- Botões de compartilhamento nativo: "Compartilhar Link via WhatsApp", "Salvar Imagem".
- Tracking de Analytics: Quantos QR codes foram gerados, compartilhados e quantas avaliações vieram da origem `qr`.
- **Componentes Necessários**: `DashboardHome`, `QRCodeGeneratorScreen`, `ShareButtonCard`, `MetricHighlight`.

**Entregáveis**:
- Tela de Dashboard da Empresa com métricas principais (Leads, Nota, Views).
- Tela de Geração/Exibição do QR Code de avaliações.
- Funcionalidade de compartilhamento nativo (Share API do React Native).

**Testes E2E**:
- Empresa acessa Dashboard -> Clica em "Gerar QR" -> QR Code renderiza instantaneamente.
- Empresa clica em Compartilhar -> Share sheet nativo do Android/iOS abre.
- Cliente escaneia o QR gerado -> App abre direto no formulário de review daquela empresa específica.

### 21.4. Reformulação Total de UX/UI (Jornada)
Para atingir o padrão "OLX", a interface do app será revisada:
- **Home**: Menos texto, mais cards visuais grandes. Banners devem parecer vitrines de ofertas.
- **Perfil da Empresa**: Botões de ação flutuantes e persistentes ("Iniciar Chat", "Ligar").
- **Tipografia e Cores**: Contrastes maiores (Azul vibrante vs. Fundo cinza super claro) para transmitir modernidade e confiança tecnológica.
- **Micro-interações**: Skeleton loaders suaves ao invés de spinners, feedback háptico (vibração) ao curtir, salvar ou enviar mensagens.
