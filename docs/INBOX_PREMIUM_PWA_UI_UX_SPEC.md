# Especificação de Design e UI/UX Premium PWA — Unified Inbox Enterprise

> **Documento:** Especificação Visual, Componentes e Responsividade (PWA)  
> **Sistema:** Avalia Solar 2026 (`AB0-1-front`)  
> **Padrão de Design:** Enterprise SaaS A+++, Compacto, Legível e Acessível (WCAG AA)  

---

## 1. Princípios de Design e Tokens Visuais

- **Identidade da Marca:**
  - Azul Institucional Primário (`#1d4ed8` / `--color-primary`) para CTAs e destaque de mensagens enviadas.
  - Amarelo Solar (`#f59e0b` / `--color-accent`) para avisos de SLA crítico, propostas pendentes e estrelas de reputação.
  - Superfícies Neutras Claras (`#f8fafc`, `#ffffff`, bordas sutis `#e2e8f0`) com legibilidade máxima de tipografia.
  - Modo escuro / contrastes WCAG: Rácio mínimo de contraste 4.5:1 para texto padrão e 3:1 para controles gráficos.
- **Tipografia:** Fonte do sistema com `Inter` ou nativa, tabular-nums para horários e valores financeiros, sem texto truncado que impeça a leitura de informações essenciais.

---

## 2. Layouts por Breakpoint

### 2.1 Desktop (>= 1200px) — 3 Colunas com Zero Espaço Morto
- **Coluna 1 (Lista de Atendimentos):** `320px–360px`
  - Campo de busca instantâneo com debounce.
  - Filtros em pílulas (`Todas`, `Não lidas`, `Aguardando`, `Arquivadas`).
  - Cards de conversa com: avatar com iniciais/foto, nome do lead/comprador, selo de canal (`P2P` ou `IA`), prévia da última mensagem, timestamp relativo, badge de não lidas e indicador de SLA.
- **Coluna 2 (Thread Principal):** `minmax(0, 1fr)`
  - Header fixo com nome do cliente, canal, status do atendimento, proposta vinculada com link direto e ações rápidas (Resolver, Arquivar, Menu de Opções).
  - Timeline com agrupamento cronológico de mensagens por data (`Hoje`, `Ontem`, `13 de out.`).
  - Balões de mensagem diferenciados: remetente (azul/direita), cliente (cinza claro/esquerda), bot IA (slate escuro/esquerda).
  - Composer fixado na base com upload de anexos, mensagens rápidas salvas e atalho `Enter` para envio.
- **Coluna 3 (Painel de Contexto do Cliente):** `280px–320px` recolhível
  - Quando selecionado: ficha do lead, intenção de compra, fatura de energia, histórico de propostas emitidas e ações comerciais.
  - Quando nenhuma conversa selecionada: estado vazio útil com guia de produtividade e atalhos rápidos para Leads e Propostas.

### 2.2 Tablet (768px – 1199px) — 2 Colunas Flexíveis
- Lista de conversas + Thread principal.
- O painel de contexto do cliente abre via **Drawer Lateral** sob demanda pelo botão no cabeçalho da thread.
- O menu lateral global colapsa para modo compacto (rail de ícones com tooltips acessíveis).

### 2.3 Mobile / PWA (320px – 767px) — Navegação Fluida por Estados
- **Estado 1 (Lista):** Ocupa 100% da viewport. Touch-targets generosos (mínimo 44x44px).
- **Estado 2 (Thread Ativa):** Transição suave para tela cheia ao tocar em uma conversa. Botão "Voltar" no topo esquerdo para retornar à lista. Composer respeita `--safe-area-inset-bottom` e altura dinâmica de teclado (`100dvh`).
- **Estado 3 (Ficha do Lead/Proposta):** Abre via **Bottom Sheet Modal** nativo com botão de fechar acessível.

---

## 3. Estados Obrigatórios de Interface

1. **Carregando Inicial:** Skeletons elegantes na lista e área de mensagem.
2. **Lista Vazia Real:** Ilustração discreta com mensagem motivadora e atalho para o marketplace de leads.
3. **Busca Sem Resultados:** Aviso claro `"Nenhuma conversa encontrada para '[termo]'"` com botão de limpar filtro.
4. **Erro de Carregamento (Rede/500):** Banner não invasivo com botão de "Tentar novamente".
5. **Acesso Negado (403):** Tela explicativa com opção de alternar empresa.
6. **Canal IA Desativado (Plano Free):** Badge de upgrade sutil na aba IA sem impactar conversas P2P.
7. **Envio Otimista:** Mensagem aparece imediatamente com ícone de relógio `🕒`, atualizando para `✓` quando confirmada pelo servidor.
8. **Falha de Envio:** Destaque em vermelho com botão inline de "Reenviar".
