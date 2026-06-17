# UI SPEC — Manual Visual Premium Leve

Este documento orienta o desenvolvimento visual da página de perfil, estabelecendo cores harmoniosas, sombras delicadas, tipografia marcante e espaçamentos nobres para assegurar o visual **Premium Leve** de SaaS de marketplace moderno.

---

## 1. Sistema de Cores e Tokens Visuais

Utilizaremos uma paleta de cores balanceada baseada em HSL para garantir constância visual e suporte a interações ricas:

- **Fundo Principal (Background):** `hsl(210, 40%, 98%)` — Um cinza-azuladinho extremamente premium e suave que afasta o visual cru de fundo branco.
- **Fundo de Cards:** `hsl(0, 0%, 100%)` — Branco puro para destacar os cards do fundo.
- **Cor Primária (Ações e Links):** `hsl(221, 83%, 53%)` — Azul dinâmico para CTAs principais e links interativos.
- **Cor Secundária (Premium/Destaques):** `hsl(38, 92%, 50%)` — Dourado nobre e sofisticado para badges e destaques de plano Pro/Premium.
- **Cor de Confiança (Sucesso/Verificação):** `hsl(142, 71%, 45%)` — Verde suave para selos de empresas verificadas.
- **Cor do Texto Principal:** `hsl(224, 71%, 4%)` — Azul escuro quase preto para máxima legibilidade e sofisticação tipográfica.
- **Cor do Texto Secundário:** `hsl(215, 16%, 47%)` — Cinza-azulado para legendas e textos de suporte.

---

## 2. Tipografia e Ritmo Visual

Usaremos famílias tipográficas modernas de alta performance (Inter ou Outfit) aplicadas por meio do TailwindCSS:

- **Títulos Chave (Hero & Seções):** `font-black text-slate-950 tracking-tight` — Títulos com peso extra-negrito e espaçamento de letras ajustado para criar forte apelo moderno.
- **Textos de Apoio e Parágrafos:** `text-sm leading-relaxed text-slate-600` — Excelente leitura de descrições e depoimentos de reviews.

---

## 3. Sombras e Bordas (Borders & Shadows)

Para dar o efeito de **profundidade leve** ("Soft Elevation") sem poluir a interface:

- **Bordas de Cards:** `rounded-2xl border border-slate-100/80` — Cantos super arredondados, que transmitem modernidade e suavidade.
- **Sombras (Shadows):** `shadow-sm hover:shadow-md transition-shadow duration-300` — Sombras extremamente sutis nas laterais e embaixo do card, que se expandem suavemente quando o usuário passa o mouse (*hover*), dando vida e dinamismo à navegação.

---

## 4. Micro-Animações e Interatividade

- **Hover em Botões:** Efeito de escala suave (`scale-[1.02]`) e transição de cor de fundo com `duration-200`.
- **Mudança de Abas:** Transição lateral suave com opacidade usando `framer-motion` para guiar o foco visual sem interrupções abruptas.
- **Carregamento (Skeletons):** Pulsação de opacidade harmônica e lenta (`pulse` com duração de 1.5s).
