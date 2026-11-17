# PRD / GAP — seletor Lista / Grade em `/products`

**Data:** 2026-11-17  
**Escopo:** Next.js PWA e web, rota `/products`  
**Prioridade:** P1 visual para experiência mobile (sem impacto em API ou DB)  
**Status:** correção implementada em branch de hotfix; testes de CI e smoke devem validar antes de merge.

## Problema e evidência

Na captura móvel, o botão ativo (Lista) excede o contorno do seletor. O botão Grade aparenta estar desalinhado e o grupo perde coesão. O layout original em `AB0-1-front/app/products/page.tsx` definia `h-10` (40px) no grupo e `h-8 w-8` (32px) nos botões.

Entretanto:
- `AB0-1-front/app/globals.css` aplica `min-height: 48px; min-width: 48px` a `button` abaixo de 768px;
- `AB0-1-front/components/ui/button.tsx` aplica `max-sm:min-h-[48px] max-sm:min-w-[48px]`.

Isso força 48px dentro de um grupo de 40px. Os botões transbordam, sem que a mudança de `h-8` para outro tamanho menor possa corrigir.

## Objetivo

Fazer Lista/Grade aparecer como **um único controle segmentado** com estados claramente identificáveis, alinhamento e geometria estável, preservando a troca de layout e acessibilidade em telas pequenas, PWA instalado e desktop.

## GAP e requisitos

| ID | Requisito | Antes | Depois / aceite |
| --- | --- | --- | --- |
| R01 | Geometria | grupo 40px / botões com mínimo 48px | grupo 48px; segmentos 44×44px, dentro da borda |
| R02 | Sobrescrita local | dimensões conflitantes com estilos globais | `!min-h-11 !min-w-11` apenas no alternador |
| R03 | Acessibilidade | botões apenas por ícone, sem nome nem estado ARIA | `aria-label`, `aria-pressed`, `role="group"` e foco visível |
| R04 | Interação | estado em `/products` | mantém estado controlado e renderiza ProductCard horizontal/vertical |
| R05 | Modo mobile | largura fixa de select + rótulo visível + toggle | rótulo de ordenação escondido abaixo de 640px; select 144px; toolbar wrap |
| R06 | Escopo | risco de alterações gerais de botões | nenhuma mudança em `globals.css`, `Button` ou Rails |
| R07 | Regressão | sem cobertura isolada | testes para ARIA, dimensões de classe, alternância lista/grade |

## Especificação visual mobile-first

- **Grupo:** `h-12` (48px), borda 1px, `p-px` (1px), cantos `rounded-xl` (12px), fundo branco, sombra discreta.
- **Segmentos:** `h-11 w-11` (44×44px), cantos `rounded-lg` (8px), sem padding; `!min-h-11 !min-w-11` vence o mínimo global de 48px. Os 44px são uma exceção local, em linha com alvos acessíveis e espaçamento próprio.
- **Ícones:** `18×18px`; ativo com `bg-blue-50 text-blue-700`; inativo `text-slate-700`.
- **Controles adjacentes:** select de 144px em mobile, 176px desde `sm`; barra com `flex-wrap` para evitar corte, largura 100% no mobile.
- **Estados:** Lista é o padrão existente; foco por teclado e `aria-pressed` são explícitos. A troca não altera filtros, query string ou paginação.
- **Breakpoints para smoke:** 320, 375, 390, 430, 768 e 1280px; Safari iOS/PWA e Chromium/desktop. Verificar zoom de página e tamanhos de fonte.

## User stories

- **US01 (visitante mobile):** ao abrir `/products`, vejo Lista e Grade lado a lado dentro de uma borda única; nenhuma aba salta para fora.
- **US02 (pessoa navegando por teclado/leitor de tela):** cada botão anuncia seu nome e se está pressionado; posso alternar por clique ou teclado.
- **US03 (visitante com tela estreita):** consigo acessar ordenação e troca de visualização sem scroll horizontal inesperado.
- **US04 (visitante desktop):** a troca continua alterando o layout de cards entre linhas e grade, sem interferir em filtros.

## Testes / TDD

1. Unitário Jest/RTL: Lista inicia pressionada e Grade não; `type=button`; grupo nomeado.
2. Unitário Jest/RTL: botões recebem `h-11 w-11 !min-h-11 !min-w-11` e contêiner `h-12`.
3. Unitário Jest/RTL: callback alterna para `grid` e de volta para `list`; novo estado reflete corretamente em `aria-pressed`.
4. Quality gates frontend: `npm run typecheck`; `npm run lint`; `npm run test -- --runInBand components/products/ProductViewToggle.spec.tsx`. No CI, seguir a política de escopo do repositório.
5. Smoke browser: medir `getBoundingClientRect()` dos botões e contêiner (botões dentro), verificar `scrollWidth <= clientWidth` em 320–430px, conferir layout de cards antes/depois.
6. Smoke PWA instalado: iOS Safari, light/dark se aplicável, safe areas e clique sem zoom acidental.

## Riscos / rollback

- Risco restrito a espaçamento da toolbar e a uma exceção de min-size para dois botões.
- Classes de override importantes necessárias porque a regra global possui mínimo explícito; não removê-las sem alterar o contrato global.
- Rollback: reverter o(s) commit(s) do PR (apenas frontend), sem migração de banco.
- Não efetuar merge/deploy até a validação do CI e ao menos um smoke em viewport mobile.

## Arquivos afetados

- `AB0-1-front/app/products/page.tsx` — integração e toolbar.
- `AB0-1-front/components/products/ProductViewToggle.tsx` — componente isolado.
- `AB0-1-front/components/products/ProductViewToggle.spec.tsx` — regressão.
- Este PRD.

Não é necessária alteração no backend, schema, APIs, workflows ou componentes globais.
