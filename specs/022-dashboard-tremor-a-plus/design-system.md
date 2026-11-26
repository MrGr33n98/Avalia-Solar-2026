# Design System — Tremor UI inspiration only, Avalia Solar
## Tokens atuais confirmados no globals.css
Light: ink 222 47% 11%; panel 0 0% 100%; surface 210 40% 98%; muted 215 16% 47%; accent/ring 221 83% 53%; border 214 32% 91%; rail 209 100% 15%; positive 142 71% 45%; warning 38 92% 50%; danger 0 84% 60%; chart1 azul, chart2 roxo. Dark: ink 210 40% 98%; panel 222 47% 11%; surface 222 47% 7%; muted 215 20% 65%; border 217 33% 17%; rail 222 47% 7%. Outros presets de tema aparecem no CSS; mapear nomes e persistência antes de consolidar. Marca azul #2563EB, navy #0F172A e solar #F59E0B, verde #047857 para texto de sucesso sobre claro. Não confundir cor de gráfico com estado.

## Proposta visual
Superfícies neutras; bordas finas e sombras sutis, rail discreto, apenas um accent principal, sem glow/gradiente decorativo. Logo original e ícones de categorias preservados. Light/dark sem cores hardcoded em cards; status sempre label + ícone + cor. Verificar WCAG AA 4.5:1 texto normal, 3:1 texto grande e controles, contraste real de hover/disabled. Não impor mudança de marca. Numeric tabular-nums; pt-BR com Intl, moeda BRL somente para valores monetários, unidades kWp/kWh/% conforme backend.

| Tipo | Tamanho alvo px | Line height px | Peso |
|---|---:|---:|---:|
| Página | 24 | 32 | 600 |
| Seção | 18 | 24 | 600 |
| Card | 14 | 20 | 600 |
| Corpo | 14 | 20 | 400 |
| Tabela | 13 | 18 | 400 |
| Label | 12 | 16 | 500 |
| Metadado | 12 | 16 | 400 |
| KPI | 28–32 | 36–40 | 600 |

Fonte atual system-ui; preservar; não introduzir famílias tipográficas de terceiros nesta Spec. Não usar fontes externas necessárias. Global CSS reduz base rem por viewport (16/14.5/14/13.5px); não alterar global; medir valores computados e criar escala dashboard isolada em rem/token sem quebrar zoom.

## Geometria proposta
Grid 4px; gaps 8/12/16/24/32; desktop max 1400px atual como baseline, avaliar expansão para tabelas em widescreen; gutter 24px desktop, 16 tablet, 12–16 mobile; card padding 16 (12 compacto), border 1px, radius 8–12 (não 24 em telas operacionais). Toolbar 56px alvo; filtros 36–40px desktop; mobile alvos 44–48px com convenção interna 48px verificada no CSS anterior. Avatar circular 32/40/48 quando compatível com logo; gráficos altura 240–320 desktop, 200–240 mobile; tabelas rows 40–48 desktop, 48–56 mobile; labels de ícones e tamanho 16/20. Menu, modal e drawer sem overflow em zoom 200%.

## Motion
Hoje: sidebar/padding 200ms, cor 300ms, spinner/pulse. Proposta: 120–180ms hover/focus, 180–240ms drawer/tab, 0–80ms reduced-motion sem deslocamento; skeleton sem pulse para reduced motion; animar opacity/transform quando possível, evitar height/layout e transition-all; gráfico sem animação longa, atualização mantém foco/scroll; feedback instantâneo, sem loaders de tela inteira após shell pronto. Não modificar animações existentes sem comparar. Testar cancelamento, rapid toggles, foco e estabilidade.

## Responsive
320/360/390/430 mobile, 768 tablet, 1024 rail, 1180 breakpoint, 1280/1440/1920 desktop; também 200% zoom e orientação landscape. Sidebar mobile drawer, menu contextual; KPI 1–2 colunas conforme largura sem cortar texto, 3–5 desktop se couber. Tabelas scroll interno com cabeçalho semântico, ou cards de detalhe mobile para ações; nunca remover coluna crítica sem acesso alternativo. Drawer desktop vira full-screen mobile. Tabs scroll horizontal apenas na própria faixa, com indicação de seleção e teclado. Safe areas, teclado virtual e sticky footer sem sobrepor última linha.
