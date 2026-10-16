# REFERÊNCIA VISUAL — Fluxo de Propostas (Avalia Solar)

> Companheiro do `PROMPT_AGENTE_FLUXO_PROPOSTAS.md`. Descreve **o que as imagens de referência mostram** e **como cada peça deve ser construída**: componentes, chips, features, espaçamentos, hierarquia, layout e responsividade.
> **Quem manda em quê:** a imagem manda na *estética* (formas, proporções, clima); este texto e o prompt mandam nos *números e comportamentos*. Em conflito: prompt > `rfp1.png` > este documento > `rfp.png` / `rfp2.png` / `rfp3.png`.
> Medidas em px para viewport **390 px de largura** (alvos, não pixels exatos da imagem).
> Fontes: `rfp1.png` (lista master), `rfp.png` (8 telas), `rfp2.png` (6 telas), `rfp3.png` (10 telas).

---

## 1. DNA visual (leia antes de codar)

| Eixo | Como é |
|---|---|
| Clima | Limpo, confiável, "fintech/marketplace" moderno. Muito branco, azul de marca, amarelo só para decisão. |
| Fundo | Azul-gelo muito claro (`--bg #F5F8FD`) com **cards brancos** elevados por borda 1 px + sombra quase invisível. |
| Cor de marca | Azul royal (`--brand #2563EB`) em links, aba ativa, etapa atual, botão azul, ícones de destaque. |
| Cor de ação | Amarelo-âmbar (`--cta #FBBF24`) **somente** em CTA de decisão, texto em azul-marinho (`--ink #0F172A`), **nunca** branco. |
| Formas | Cantos generosos: card 16, botão/input 12, logo 12, chips e badges totalmente redondos (pill). |
| Ícones | Traço fino (outline, ~1.75), cor `--muted` por padrão e `--brand` quando ativos; preenchidos só em estado ativo (nav, coração favoritado). |
| Tipografia | Sans geométrica tipo Inter. Pesos 400/500/600/700. Títulos azul-marinho, apoio cinza-azulado. |
| Densidade | Compacta: poucos respiros grandes; informação em linhas curtas; sem blocos decorativos. |
| Profundidade | Sombra só em cards e barras fixas; sem gradientes, exceto no hero/ilustração. Sem sombras pesadas. |
| Logos de empresa | Quadrados arredondados com a logo ocupando a área (Sungrow laranja, Growatt branco, Sicoob verde-escuro, WEG azul). |
| Sinal de confiança | Selo azul de "verificada" ao lado do nome, nota com estrela amarela e contagem de avaliações. |

**Proporção de uso de cor numa tela típica:** ~65% branco/azul-gelo · ~25% texto marinho/cinza · ~8% azul · ≤ 2% amarelo (1 botão por área).

---

## 2. Anatomia de layout

### 2.1 Pilha vertical padrão (mobile)
```
[ status bar do aparelho ]
[ AppHeader 52 ]                         ← logo + busca + avatar/menu
[ conteúdo da tela (rola) ]              ← padding-x 16
[ StickyActionBar 56 + safe ]  (quando houver)
[ BottomNav 56 + safe ]        (quando houver)
```
- O conteúdo ganha `padding-bottom` = soma das barras fixas visíveis + safe area.
- **Barras fixas empilhadas** (visto em `rfp.png` #3 e #4): ActionBar fica **acima** da BottomNav (112 px reservados no total).
- **Observado por tela:**
  - Detalhe da proposta (#2) e perfil/solicitar (`rfp2.png` #3, #4) **não** mostram BottomNav;
  - **Divergência A VALIDAR:** em `rfp3.png`, as telas 5 (Personalizar) e 9 (Perfil) aparecem **com** BottomNav. Até decisão, siga a tabela da seção 2 do prompt;
  - PDF (#3), comparar (#4), escolhida (#7), acompanhamento (#8), concluído (#10) **mostram** BottomNav;
  - Thread de chat (#6): **sem** BottomNav (decisão D13).

### 2.2 Grade e margens
- Margem lateral da página: **16**. Cards ocupam 100% da largura útil (358 @390).
- Dentro do card: padding **12**. Dentro de caixas informativas: **10×12**.
- Colunas internas: sistema de 4 px; 2, 3 e 4 colunas **iguais** com divisores de 1 px (`--line`) entre elas (SpecRow, StatTile, métricas).
- Largura máxima de leitura em telas grandes: 720 (≥ 768) / 960 (≥ 1024).

### 2.3 Ordem de empilhamento (z-index)
`conteúdo 0` < `barras fixas 20` < `header 30` < `sheet/modal overlay 50` < `toast 60`. Toast nunca cobre o CTA principal (aparece acima da ActionBar).

---

## 3. Hierarquia visual

### 3.1 Níveis de ênfase (do mais forte ao mais fraco)
| Nível | O quê | Estilo |
|---|---|---|
| **N1** | Preço do card / preço hero; H1 da tela; CTA amarelo | 18–24 px 700 marinho; botão preenchido |
| **N2** | Nome da empresa; título de seção; valores de spec | 15/20 600 marinho; 12–13 600 |
| **N3** | Nota (★ 4,8); abas; botão secundário; valor de linha de resumo | 13 600 |
| **N4** | Metadados (cidade, kWp · tipo), labels de spec, subtítulos | 12 400–500 `--muted` |
| **N5** | Datas, contadores, legendas, horas de mensagem | 11 400 `--muted` |

### 3.2 Regras de hierarquia por contexto
- **Card de proposta:** preço (N1) > nome (N2) > nota/status (N3) > cidade/kWp (N4) > data (N5). O CTA amarelo é o único elemento preenchido de cor forte do card.
- **Detalhe:** preço hero (N1) > 3 stats (N2) > linhas de resumo (N3/N4) > equipamentos. CTA amarelo fixo no rodapé.
- **Comparar:** coluna de labels discreta (N4 em negrito leve), valores N3; **nenhum destaque de cor** nas células (exceto a coluna focada com borda `--brand`).
- **Chat:** texto da mensagem N3; hora N5; nome da empresa no header N2.
- **Formulários:** H1 (N1) > rótulo do campo 14/20 600 (N2) > opções > ajuda 12 `--muted`.
- **Botões lado a lado:** o primário (amarelo/azul sólido) é **sempre à direita** e **maior** (1.35–1.4×); o secundário à esquerda.

---

## 4. Escala de espaçamento (regras exatas)

Escala base: **4 · 8 · 12 · 16 · 20 · 24 · 32**. Não use outros valores.

| Entre… | Espaço |
|---|---|
| Borda da tela ↔ conteúdo | 16 |
| Cards na lista | 10 |
| Seções (título de seção ↔ seção anterior) | 12–16 |
| Título de seção ↔ primeiro item | 8 |
| Header global ↔ linha "← Meus projetos" | 4 |
| "← Meus projetos" ↔ H1 | 4 |
| H1 ↔ metadados | 2–4 |
| Metadados ↔ stepper | 12 |
| Stepper (círculo) ↔ label | 4; label ↔ data: 2 |
| Stepper ↔ tabs | 8 |
| Tabs ↔ banner | 12 |
| Banner ↔ toolbar | 12 · toolbar ↔ 1º card: 8 |
| Logo ↔ bloco de texto do card | 10 |
| Linhas de texto dentro do bloco (nome/nota/cidade) | 2 |
| Bloco superior do card ↔ SpecRow | 8 · SpecRow ↔ botões: 8 |
| Entre botões na mesma linha | 8 |
| Ícone ↔ texto (botão, meta) | 6 (meta 14 px: 4) |
| Chips na mesma linha | 8 |
| Rótulo de campo ↔ controle | 6 · entre campos de formulário: 16 |
| Bolhas do mesmo grupo | 2 · entre grupos: 10 · separador de dia: 12 acima/abaixo |
| Composer: padding | 8×12 · gap entre elementos 8 |
| ActionBar: padding | 8×16 · gap 8 |
| Último elemento ↔ barra fixa | 16 |

**Anti-gordura:** nenhum espaço vertical vazio > 16 dentro de uma seção. Se um bloco precisa de "respiro" maior, é sinal de conteúdo faltando ou componente errado.

---

## 5. Catálogo de chips e badges (referência completa)

> "Chip" = elemento compacto, arredondado, de estado/filtro/atalho/contexto.  
> Todos com `min-height` conforme a tabela; texto **nunca quebra**; ícone opcional à esquerda.

| # | Chip | Onde aparece | Texto de exemplo | Altura / padding / raio | Cores | Estados e observações |
|---|---|---|---|---|---|---|
| C1 | **StatusChip "recebida"** | card da lista, topo direito | `✓ Proposta recebida` + abaixo (fora do chip) `em 06/10/2026` | 22 · 0×8 · pill; ícone check-circle 12 | bg `--ok-bg`, texto `--ok-fg` 11/14 600, borda `--ok-line` | Variações: `Visualizada` (cinza-azulado), `Em análise` (âmbar), `Escolhida` (azul), `Recusada`/`Expirada` (cinza) |
| C2 | **Chip overlay do hero** | canto inferior direito da imagem do detalhe (`rfp.png` #2) | `Proposta recebida` / `em 06/10/2026` (2 linhas) | auto · 6×10 · raio 10 | fundo branco 92% opaco, texto marinho 11/14 600 + 10/12 muted | Inset 8 do canto; sombra leve |
| C3 | **Chip benchmark** | dentro do ValueCard, alinhado à direita do rótulo/preço | `Dentro da média da região` | 22 · 0×8 · pill | verde (`--ok-*`) 11/14 500 | só aparece se a API enviar `priceBenchmark`; `below` = verde "Abaixo da média", `above` = âmbar "Acima da média" |
| C4 | **Contador da galeria** | canto inferior direito do hero | `📷 1/12` | 24 · 0×8 · pill | fundo marinho 60%, texto branco 11/14 600 | atualiza no swipe; some se 1 imagem |
| C5 | **Contador de página (PDF)** | canto superior direito da página | `1 / 12` | 24 · 0×10 · pill | fundo marinho 75%, branco 11/14 600 | atualiza com a rolagem; sempre visível |
| C6 | **Chips segmentados (kWp)** | formulário de solicitação | `5 · 8,5 · 10 · 15 · Outro` | 40 · 0×12 · raio 12, 5 colunas iguais | normal: branco + borda `--line` + texto marinho; **selecionado:** fundo `--brand-50` + borda 1.5 `--brand` + texto `--brand` 600 | seleção única; `Outro` abre campo numérico; padrão = potência do projeto |
| C7 | **Toggle Sim/Não** | "Necessita financiamento?" | `Sim` / `Não` | 40 · raio 12, 2 colunas iguais, gap 8 | igual ao C6 | seleção única; padrão `Não` |
| C8 | **Chips de atalho (chat)** | acima do composer (`rfp.png` #6) | `Agendar visita` `Tirar dúvida` `Solicitar ajuste` | 32 · 0×12 · pill | fundo branco, borda `--brand-200`, texto `--brand` 13/16 500 | rolagem horizontal com fade na borda; tocar **preenche** o campo |
| C9 | **Respostas sugeridas** | acima do composer (quando o campo está vazio) | `Podemos melhorar o preço?` | 32 · 0×12 · pill | fundo `--brand-50`, borda `--brand-200`, texto marinho 13/16 | até 3; some ao digitar |
| C10 | **Chips de filtro (inbox)** | topo da caixa de entrada | `Todas` `Não lidas` | 32 · 0×12 · pill | ativo: `--brand-50` + borda `--brand-200` + texto `--brand` 600; inativo: branco + borda `--line` | seleção única |
| C11 | **Chip de contexto** | `ContextBar` do chat; linha 3 do item da inbox | `Proposta #AS-2026-D00000016 · R$ 45.000,00 · Recebida ›` | 32 · 0×12 · raio 12 (retangular suave) | `--brand-50` + borda `--brand-200`, 12/16 500 | 1 linha, ellipsis no código; toque abre proposta/sheet |
| C12 | **UnreadBadge** | nav "Mensagens", item da inbox, avatar (bolinha) | `3`, `9+` | min 16 × 16 · 0×4 · pill | fundo `--danger`, texto branco 10/12 700 | bolinha sem número = 8 px (avatar do header) |
| C13 | **VerifiedBadge** | ao lado do nome da empresa | (ícone selo azul com check) | 16 | azul `--brand` com check branco | `aria-label="Empresa verificada"` |
| C14 | **Rating** | card, detalhe, perfil | `★ 4,8 (126 avaliações)` | linha de 18 | estrela `--star`, valor 13/18 600, contagem 12 muted | sem avaliações: `Novo` |
| C15 | **Selo de confiança** | perfil da empresa (3 colunas) | `Equipe própria / Instalação`, `Suporte no Brasil / Pós-venda`, `Assistência técnica / Autorizada` | ícone 20 + título 12/16 600 + sub 11/14 muted | sem fundo, só ícone em traço | só os confirmados pela API |
| C16 | **Tile de comparação** | topo do comparar | logo da empresa + `×` | 72×56 · raio 12 · `×` 20 no canto (inset 4) | cartão branco com sombra leve | `×` remove; slot `+` tracejado quando há vaga |
| C17 | **Bolinha de novidade (stepper)** | ao lado do círculo da etapa atual | (círculo 14 com borda azul e seta) | 14 | borda `--brand`, fundo branco | só com atualização não vista |
| C18 | **System message (chat)** | centro da thread | `Empresa escolhida · 06/10 14:32` | 24 · 0×10 · pill | fundo `--bg` escuro 4%, texto 12 muted | eventos do sistema |
| C19 | **Divisor de não lidas** | thread | `2 novas mensagens` | linha com chip central 24 | texto `--brand` 12 600 + linhas `--brand-200` | rola até aqui ao abrir |
| C20 | **Pill de nav ativa** | BottomNav | (ícone preenchido + label azul) | — | `--brand` | sem fundo atrás do ícone; só cor + preenchimento |

**Regras gerais de chip:** nunca duas linhas; nunca mais de 3 cores; ícone 12–14; contraste AA; `touch-target` ≥ 40 via área clicável estendida (mesmo com 32 de altura visual).

---

## 6. Listagem completa de telas e componentes (clone fiel)

### Tela 1 — Lista de propostas recebidas (visão geral das propostas enviadas)
- **AppHeader 52 px:** Logo Avalia Solar + busca + avatar/menu
- **Breadcrumb:** `← Meus projetos`
- **H1:** `Projeto Residencial` + ícone de editar
- **Metadados:** `Residencial · Florianópolis, SC · 8,5 kWp`
- **Stepper horizontal (5 etapas):** Solicitação → Propostas → Em análise → Decisão → Projeto
- **Tabs:** `Propostas recebidas (3)` | `Em análise (0)` | `Escolhidas (0)`
- **Banner informativo azul-claro:** "3 empresas enviaram propostas para o seu projeto..."
- **Botão central:** "Comparar propostas" (outline)
- **Toolbar:** "Mais relevantes" + "Filtrar"
- **ProposalCard (repetível):**
  - Logo quadrado 40×40 raio 12 (Sungrow, Growatt, Sicoob)
  - Nome + VerifiedBadge + Rating (C14) + localização
  - StatusChip "Proposta recebida" (C1) + data
  - Preço N1 + potência + tipo
  - SpecRow: 45 dias · 10 anos · Instalação
  - Botões lado a lado: "Ver proposta (PDF)" (secundário) + "Escolher empresa" (CTA amarelo)
- **BottomNav:** com "Propostas" ativo + UnreadBadge no Chat

### Tela 2 — Detalhes da proposta (informações completas, escopo)
- **Hero image full-width:** com overlay C2 ("Proposta recebida em 06/10/2026") + contador C4 ("📷 1/12")
- **Header empresa:** logo + nome + VerifiedBadge + Rating + cidade
- **Tabs:** `Resumo` | `Equipamentos` | `Condições` | `Empresa`
- **ValueCard:** preço N1 + Chip benchmark (C3 - "Dentro da média da região")
- **3 StatTiles:** Potência (8,5 kWp) · Prazo instalação (45 dias) · Garantia (10 anos)
- **Lista Equipamentos principais:**
  - Painéis solares Sungrow 550W (16 unidades)
  - Inversor Sungrow 8kW (1 unidade)
  - Estrutura de fixação Alumínio anodizado
- **StickyActionBar (sem BottomNav):** "Conversar" (outline) + "Escolher empresa" (CTA amarelo)

### Tela 3 — Proposta completa (visualização do PDF enviada)
- **Header:** "Proposta Comercial"
- **Página PDF:** com contador C5 (1/12)
- **Toolbar inferior:** zoom / download / página cheia
- **StickyActionBar + BottomNav:** "Baixar PDF" + "Escolher empresa"

### Tela 4 — Comparar propostas (compare preços, equipamentos)
- **Header:** "Comparar propostas" (Selecione até 3 propostas)
- **3 ComparisonTiles (C16)** no topo (removíveis com ×)
- **Tabela comparativa 4 colunas:** (labels + 3 empresas)
- **Células compactas:** sem cor de destaque (exceto borda brand na coluna focada)
- **StickyActionBar + BottomNav:** "Solicitar ajuste" + "Escolher empresa"

### Tela 5 — Personalizar solicitação (ajuste do projeto antes de enviar)
- **Stepper:** 1-2-3 (Projeto → Detalhes → Revisar)
- **H1:** "Personalize sua solicitação" + subtítulo explicativo
- **Campo Potência desejada:** chips segmentados C6 (5, 8,5, 10, 15, Outro)
- **Tipo de instalação:** 3 cards com ícone (Telhado, Solo, Carport)
- **Necessita financiamento?:** toggle Sim / Não (C7)
- **Observações:** textarea 0/500
- **CTA full-width amarelo:** "Enviar solicitação"
- **BottomNav:** visível

### Tela 6 — Conversa com a empresa (chat direto)
- **Header:** logo + nome da empresa + status "Online agora"
- **Bolhas de mensagem:** empresa à esquerda, comprador à direita
- **System message (C18):** eventos do sistema
- **Card de anexo:** PDF com botão de download
- **Chips de atalho (C8):** "Agendar visita", "Tirar dúvida", "Solicitar ajuste"
- **Composer fixo:** input + anexar + microfone + botão enviar
- **Sem BottomNav**

### Tela 7 — Escolher empresa (confirmação da escolha e próximos passos)
- **Ícone de sucesso:** grande círculo verde com check + confetes
- **H1:** "Empresa escolhida! Sungrow Brasil"
- **Texto explicativo:** "A empresa foi notificada e entrará em contato para os próximos passos."
- **Timeline vertical:**
  - Proposta selecionada (Hoje, 06/10/2026)
  - Aguardando contato da empresa (Em até 24 horas)
  - Ajustes (se necessário)
  - Contratação
  - Instalação
- **StickyActionBar + BottomNav:** "Ver proposta" + "Ir para conversas"

### Tela 8 — Acompanhamento (evolução do projeto até a instalação)
- **Stepper horizontal:** Escolhida → Visita → Contrato → Instalação → Concluído
- **Card destaque:** "Visita técnica agendada" (Quinta-feira, 09/10/2026 às 10h · Técnico: Carlos Oliveira)
- **Seção Documentos:** PDF Proposta comercial Sungrow com botão download
- **Histórico de eventos:** timeline com checks e datas
- **BottomNav:** visível

### Tela 9 — Perfil da empresa (informações, avaliações e projetos)
- **Hero da empresa:** foto da fachada / sede
- **Header:** logo + nome + VerifiedBadge + Rating + cidade
- **Stats:** 4 métricas (Avaliação média, Avaliações, Projetos, Anos no Avalia Solar)
- **Sobre a empresa:** texto com "Ver mais"
- **3 Selos de confiança (C15):** Equipe própria, Suporte no Brasil, Assistência técnica
- **Galeria de fotos:** com link "Ver todas >"
- **StickyActionBar (sem BottomNav):** "Conversar" + "Solicitar proposta"

### Tela 10 — Conclusão (após a instalação)
- **Ilustração:** casa com painéis solares + check verde de sucesso
- **H1:** "Projeto concluído!"
- **Subtítulo:** "Seu sistema solar está gerando energia."
- **4 métricas com ícones:**
  - Potência instalada: 8,5 kWp
  - Geração estimada: 1.050 kWh/mês
  - Economia estimada: R$ 650/mês
  - CO₂ evitado: 1,2 ton/ano
- **Botões:** "+ Avaliar empresa" (azul primário) + "Ver meus projetos" (outline)
- **BottomNav:** visível

---

## 7. Regras de implementação no PWA (obrigatórias)

1. **Textos sempre visíveis** — nunca truncate títulos de seção, preços ou nomes de empresa. Use ellipsis apenas em metadados secundários (ex.: código da proposta).
2. **Compacto** — respeite a escala de espaçamento de 4 px (`4 · 8 · 12 · 16 · 20 · 24 · 32`). Nenhum gap vertical > 16 dentro de seção.
3. **Touch targets** ≥ 40 px (mesmo que o visual tenha 32).
4. **Responsivo** — mobile-first 390 px; a partir de 768 px limitar largura de leitura a 720 px e centralizar.
5. **Acessibilidade** — todos os chips e badges com `aria-label`; contraste AA; foco visível.
6. **Estado de loading / empty / error** — nunca quebrar o layout; usar skeleton no mesmo tamanho do componente real.
7. **Clone fiel** — se a imagem mostrar 3 stats, 3 stats. Se mostrar 2 botões lado a lado, o amarelo sempre à direita.
