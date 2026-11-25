# Geometria / layout
| Elemento | Regra proposta |
|---|---|
| Unidade | 4px; escala 4/8/12/16/24/32 |
| Cards | padding 12–16; border 1; radius host ou 10–12 |
| Botões | 36px desktop, 44px touch; não reduzir alvo real; frontend pode exigir 48px |
| Avatares | 40/44/56, contain, fallback inicial |
| Hero | 16:5, radius 0, contain, reserva de espaço |
| Produto | 1:1, contain, placeholder neutro |
| Projeto | 4:3, cover somente quando permitido |
| Grid | minmax(0,1fr), sem width fixo que cause overflow |
| Tabela | scroll interno acessível, cabeçalhos semânticos |

| Largura container | Layout |
|---|---|
| 280–359 | 1 coluna; controles quebram quando necessário |
| 360–479 | 1 coluna / 2 em mini cards se legível |
| 480–719 | 2 colunas quando aplicável |
| 720–959 | 2–3 colunas; comparação expandida |
| ≥960 | fullscreen, densidade maior; max 1120px atual salvo revisão |

Testar larguras 280, 320, 360, 390, 480, 720, 960, 1120; zoom 200%, nomes longos e locale. Container externo deve governar padding interno; confirmar caso `.as-frame` é próprio query container. Não esconder overflow da página para mascarar layout. Safe-area em host real.
