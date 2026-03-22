# Mídia Kit Oficial para Redes Sociais - AvaliaSolar

> Construído pelas diretrizes dos agentes do **@design-squad** (Brad Frost, Dan Mall, Dave Malouf e Visual Generator). 

A identidade de classe Enterprise da AvaliaSolar não termina no código ou nos nossos Dashboards B2B. Esse Mídia Kit transforma os mesmos algoritmos de design (*Claymorphism*, *Precision Clay*) em componentes reutilizáveis (Atomic Design) para encantar e converter pelo Instagram, LinkedIn e Twitter.

---

## 1. Fundações Atômicas (Brad Frost - *Atomic Design*)

Antes de desenhar telas, projetamos o menor elemento indivisível do Mídia Kit para redes sociais (Átomos), permitindo agilidade para criar centenas de versões. 

### 1.1 Átomos Visuais
- **Fundo Padrão (Canvas)**: Sempre `AS-Slate-950` (`#020617` / `222 47% 7%`) — Garantir que quando o usuário estiver em "Dark Mode" nos apps do LinkedIn ou Instagram as nossas imagens se fundam à tela majestosamente, apagando a borda entre o app e nossa arte.
- **Tipografia**: Família *Inter*. Sempre variando entre dois pesos radicais: `Light` (informações de leitura) e `Extra-Bold` (para dados escandalosos e métricas do Trust Score).
- **Texturas**: O desfoque natural (Blur Effect) simulando o painel de Vidro (Glassmorphism).

### 1.2 Moléculas
- **Bottom-Bar de Confiança (Selo)**: Um rodapé grudado embaixo de todos os carrosséis B2B. Ele carrega nossa URL `avaliasolar.com/trust` e o selinho do *Magic Quadrant*.
- **Indicador "Dial" de Trust Score**: O medidor de 0 a 100 de pontuação. Verde brilhante (`#10B981`) para empresas validadas; vermelho letal (`#DC2626`) para concorrentes opacos.

---

## 2. Padrões de Postagens (Dan Mall - Componentização Dinâmica)

A partir dos átomos e moléculas criamos três blocos mestres de conteúdos independentes que a equipe de social pode escalar:

### ✅ TEMPLATE 1: POSTS EDUCACIONAIS (Carrosséis LinkedIn / Instagram)
*Objetivo:* Instrução profunda e combate à desinformação de mercado ("Solarwashing").

* **Visual Principal**: Estilo "Folha de Papel Timbrado do Futuro B2B". Textos muito limpos flutuando sobre fundos densos. Linhas finíssimas (`0.5px`) da estética *Precision Clay* simulando planilhas corporativas.
* **Layout Capa (Slide 1 do Carrossel)**: 
  * "Super Headline" (Ex: `A Matemática do Colapso Solar`).
  * Efeito "Glow" Ciano sobre a tipografia primária para gerar retenção (Stop-Scrolling).
* **Layout Interior (Slides de Dados)**: 
  * Estruturas `lado a lado`. À esquerda um dado falso do mercado, à direita a dura verdade auditada pelo TaaS.
  * Uso imenso do ícone de um **Olho Aberto** para representar Inteligência Transparente.
* **Tamanho Ideal**: Carrossel 1080x1350px (vertical premium para telas mobile Retina).

### ✅ TEMPLATE 2: POSTS PARA VENDAS (Prova Social & Validação)
*Objetivo:* Fechar contratos. Exibir publicamente quem está ganhando o jogo da confiança.

* **Layout "Trophy Case" (O Quadro de Medalhas)**: Exibe a Empresa B2B X que foi certificada hoje. 
  * Paleta rica do Azul Primário (`#0056D2`).
  * Card flutuando com alto volume e sombreamento exagerado no fundo simulando **Efeito Convexo 3D**.
* **Layout "Benchmark Duel" (O Duelo TaaS)**:
  * Gráfico de dispersão real. Mostramos integradores premium (selo verde) contra aventureiros (pontilhados instáveis em vermelho). Mostra perfeitamente o risco.
* **A Chamada (CTA)**: Um sticker massivo em forma de selo brilhante: "CALCULE SEU SCORE GRATIS" ou "AUDITE SEU CONTRATO HOJE".

### ✅ TEMPLATE 3: OS MANIFESTOS (Twitter Threads / Frases de Impacto)
*Objetivo:* Pensamento crítico e viralidade (estilo Dan Koe).

* **Visual Minimalista Ascético**: Nenhuma cor exceto Fundo e Fonte Muted Gray (`#94A3B8`). Logo sutil no canto da página. O Foco da retina está na brutalidade do copy.
* **Aplica-se às**: Frases de efeito dos fundadores que geram debate corporativo (Exemplo: "Garantia de Painel não significa que a empresa não vai quebrar amanhã.").

---

## 3. Operations & Design Workflow (Dave Malouf - Design Ops)

Como a sua equipe vai operar isso no Figma e no Canva (Escala Máxima com Custo Zero de Criatividade Adicional)?

### 3.1 Design Tokens Em Ação (Figma Variables)
Crie um conjunto único de cores baseadas nas classes `tailwind.config.ts` do frontend (Azul `blue-600`, Esmeralda `emerald-500`) usando variáveis (Variables) no Figma.
**Regra Tática:** Quando a empresa for premiada no Magic Quadrant, os Designers ativam a variável "Gold Mode" nos fundos alterando instantaneamente todo o kit do azul frio para a luz Âmbar/Dourada Escura.

### 3.2 Handoff para Canais
1. **Instagram & Reels:** Uso dos vídeos dos bastidores, cobrindo o painel Trust Score no fundo. O design é reduzido, uso de texto simples em "Inter" pesado. Efeito sombra Drop-shadow forte nos textos porque os fundos são vídeos de galpões e usinas.
2. **Google & LinkedIn Ads (Banners HTML5)**: 1200x628 pixels. A chamada primária usa um Círculo com o fundo Transparente exibindo um logo genérico simulando a entrada no TaaS. O card de CTA na direita pulsa suave, animado em FramerMotion ou CSS puro.

---

## 4. Biblioteca Visual Direta ("Ctrl+C / Ctrl+V" de Especificações)

**Gradients Especiais Disponíveis aos Designers:**
* `Neon Trust` (Para vitórias e "Verified Profiles"): Mistura de Cyan `00AFEF` e Emerald `10B981`.
* `Danger Zone` (Para relatórios de risco ou alertar sobre mercado paralelo): Mistura Crimson puro para Violeta Escuro.

**Elementos Gráficos Típicos da AvaliaSolar (Assets da Marca)**
* A **Lupa de Vidro 3D** (Refletindo transparência).
* A **Barra de Carga** de 99% a 100% (Velocidade e Resolução).
* A **Esfera Hexagonal** (Lembra um painel fotovoltaico que flutua como um escudo em cima das casas).

---

> Esse núcleo de mídia garante que uma vez aprovado a identidade do site (AS-EDS), tudo transborde para o ecossistema social de forma exata. Reduz imensamente a aprovação de posts sociais usando templates fechados blindados.
