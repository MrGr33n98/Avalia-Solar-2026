# Redesign compacto IBM Carbon-inspired — Buyer Proposals (PWA e Web)

**Implementação:** 17/11/2026  
**Rota:** `/review-dashboard/proposals` no `app.avaliasolar.com.br`  
**Escopo:** frontend buyer, exclusivamente apresentação e acessibilidade. Sem migrations/API/schema.
**Referência:** PRD completo `AVALIA_SOLAR_PRD_REDESIGN_PROPOSTAS_CARBON_2026-11-17.md` (artefato entregue ao usuário). O design se inspira em Carbon, não instala `@carbon/react`.

## RCA confirmada

- CSS global `button {min-width:48px;min-height:48px}` no mobile e `Button` com `max-sm:min-h-[48px]` elevava controles especificados como `h-9`.
- Projeto `p-4 sm:p-5`, banner `p-4 sm:p-5`, container `space-y-3.5`, card `p-4 sm:p-5` + várias `mt-4/pt-3`: excessos cumulativos.
- Stepper `grid-cols-5` / `line-clamp-2` truncava rótulos sob largura limitada.
- Resumo KPI `min-h-[76px]` / `sm:min-h-[84px]`, rótulos abaixo dos números.
- Card: badge `shrink-0 whitespace-nowrap` roubava espaço do nome `truncate`.
- `Navbar` público incluía ticker B2B de 48px no painel autenticado, mesmo com `ReviewerMobileNav` próprio.
- Padding acumulado `ReviewerDashboardShell px-3` + `Workspace px-2`.

## Solução aplicada

| Elemento | Contrato final |
| --- | --- |
| Container buyer | `max-w-[1200px]` e gutters controlados exclusivamente pelo shell |
| Tokens | `BuyerProposalsDensity.module.css`: escala 2/4/8/12/16/24; raio 6/8/12; azul e marca preservados |
| Projeto | `p-3 sm:p-4`, `rounded-xl`, título 20/24 sem ellipsis e metadados com wrap |
| CTAs | Alvo real 44px com `h-11 !min-h-11`; 320px empilha, >=360px organiza em duas colunas, >=640px alinha à direita |
| Stepper | `ProjectJourneyStepper` novo, cinco estados originais, `aria-current=step`, label completo acessível; scroll interno até 389px, cinco colunas compactas desde 390px |
| Banner | `p-2.5 sm:p-3`, ícone 32/36px; CTA de comparação preservado quando elegível |
| KPI | `min-h-[64px] sm:min-h-[72px]`, rótulo/número em bloco denso, ícone a partir de 430px |
| Tabs | Segmented visual `rounded-lg`, alvos 44px, scroll local e nomes completos |
| Busca/Filtros | Busca 44px, filtro 44x44px, inputs e filtros funcionais |
| Cards | `p-3 sm:p-4`, radius 12px, logo 40/44px, status com wrap, preço sem truncar; specs reduzidas, ações 44px preservadas |
| Grid web | `container-type:inline-size`: 1 coluna base; 2 ≥690px; 3 ≥1080px de largura do container |
| Navbar | Ticker corporativo ocultado **apenas** em `/review-dashboard*`; continua público |
| Navegação | `ReviewerMobileNav` mantida, `MobileBottomNav` global continua ocultada nesta rota; barra de comparação acima da nav e oculta com teclado virtual |
| Dados | status/contadores/filters/URLs/handlers mantidos; garantia e prazo ausentes não recebem mais valores arbitrários |

## User stories de aceite

1. **Comprador mobile:** vejo projeto, local e potência com duas ações compactas, sem título cortado.
2. **Navegação de etapas:** cinco estágios exibidos; em 320–389px roláveis dentro do stepper; leitor de tela recebe título completo e estado.
3. **Resumo:** métricas continuam derivadas das propostas reais e clicáveis com alternância de filtro.
4. **Busca/ordenação:** `tab`, filtros, pesquisa e classificação não mudam de significado.
5. **Proposta:** empresa longa não some atrás do status; valor completo, especificações e ações visíveis.
6. **Comparação:** checkbox e fluxo de 2–3 propostas preservados; sticky acima da navegação e oculto ao abrir teclado.
7. **PWA:** nenhuma barra de navegação duplicada; ticker B2B não ocupa 48px no painel.
8. **Desktop:** card grid depende da largura real do container, não do viewport.
9. **Acessibilidade:** botões >=44px, ARIA, foco, texto sem clipping e suporte a zoom.
10. **Integridade:** nenhum preço/status/informação inventado e sem alteração do backend.

## Testes implementados e executáveis

- Jest: `ProjectJourneyStepper.spec.tsx` (5 etapas, ARIA, scroll, ativação).
- Jest: `ProposalStatusSummary.test.tsx` (3 colunas, contagem, filtro, densidade).
- Jest: `ProposalCompactCard.test.tsx` (nome longo, layout compacto e ação >=44).
- Jest: `Navbar.test.tsx` (ticker ausente em buyer e presente na home).
- Playwright: `tests/e2e/proposals-real-journey.spec.ts` (login real, geometria 320/375/390/430/768/1024/1440, overflow do documento, CTA e card).

Comandos:
```bash
cd AB0-1-front
npm run typecheck
npm run lint
npm run test -- --runInBand components/reviewer/proposals/ProjectJourneyStepper.spec.tsx __tests__/components/ProposalStatusSummary.test.tsx __tests__/components/ProposalCompactCard.test.tsx __tests__/components/Navbar.test.tsx
npx playwright test tests/e2e/proposals-real-journey.spec.ts
```

## Limitações e gates antes de deploy

- **Baseline visual real:** não foi possível capturar sessão comprador autenticada na origem antes do commit neste ambiente. A medição de redução >=20% / alvo 25% continua **pendente de screenshot e comparação real**, portanto nunca alegar ganho medido a partir de números do CSS.
- O smoke PWA instalado no Safari/iOS continua necessário, pois CI/WebKit não reproduz todas as características do modo standalone.
- Teste E2E condiciona asserts de projeto/card à existência desses dados no usuário real; CI deve incluir conta fixture para cobertura plena.
- Não desabilitar checks para fazer merge. Ao concluir, verificar deploy release SHA e UI em produção; reverter PR via GitHub se regressão.
