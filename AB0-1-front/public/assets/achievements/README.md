# Avalia Solar — Conquistas estilo G2

Pacote de assets SVG para o módulo de conquistas do Reviewer Dashboard.

## Estrutura

- `icons/` — emblemas coloridos desbloqueados, fundo transparente, 160x160.
- `icons_locked/` — versões bloqueadas/cinza com interrogação, 160x160.
- `cards/` — cards completos desbloqueados, 220x250.
- `cards_locked/` — cards completos bloqueados, 220x250.
- `cards_selected/` — variação selecionada com borda roxa estilo G2, 220x250.
- `previews/achievement_grid_g2_style.svg` — preview em grade para tela de conquistas.
- `previews/dashboard_strip_preview.svg` — preview em faixa para o dashboard.
- `manifest.json` — mapa dos assets.

## Direção visual

A linguagem visual foi refeita para ficar mais próxima de achievements do G2: cards brancos, fundo cinza claro, ícones emblema com sombra, estados bloqueados em cinza, estado selecionado com outline roxo e nomes curtos abaixo do badge.

## Uso recomendado

No dashboard, mostre 4 a 6 conquistas em uma faixa compacta. Na página “Conquistas Sustentáveis”, use os cards completos em grid responsivo.

Exemplo de status:
- desbloqueada: use `icons/{slug}.svg` ou `cards/{slug}_card.svg`
- bloqueada: use `icons_locked/{slug}_locked.svg` ou `cards_locked/{slug}_card_locked.svg`
- selecionada/foco: use `cards_selected/{slug}_card_selected.svg`
