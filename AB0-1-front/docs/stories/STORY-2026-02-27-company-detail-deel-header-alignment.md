# STORY-2026-02-27: Alinhar header da company detail page com a referência Deel

## Contexto
O topo atual da rota `/companies/[id]` usa um banner arredondado com card flutuante, mas a hierarquia visual, o peso dos elementos e a navegação por abas ainda estão distantes da referência enviada pelo usuário para a página da Deel. O objetivo é aproximar a experiência visual da referência sem trocar os dados reais de cada empresa.

## Requisito
Transformar o header da página de detalhe da empresa para seguir a hierarquia visual da referência Deel: breadcrumbs mais discretos, banner principal mais limpo, card branco flutuante com logo/nome/verificação/rating e CTAs reposicionados no mesmo eixo visual. Manter informações, nomes, logos e textos reais da empresa atual.

## Acceptance Criteria
- [x] O topo da página de empresa usa uma hierarquia visual próxima da referência Deel.
- [x] O card branco flutuante destaca logo circular, nome, selo de verificação e rating.
- [x] Os breadcrumbs ficam menores e menos pesados visualmente.
- [x] As abas da página passam a usar navegação linear com underline ativo, em vez do estilo pill atual.
- [x] Os CTAs principais ficam visualmente agrupados à direita do header, com prioridade clara.
- [x] Os dados reais da empresa permanecem intactos.
- [x] As validações relevantes foram executadas e qualquer bloqueio remanescente foi documentado.

## Checklist de Implementação
- [x] Criar versão compacta do breadcrumb para company detail page.
- [x] Refatorar `app/companies/[id]/components/CompanyHero.tsx`.
- [x] Refatorar a composição do header em `app/companies/[id]/CompanyDetailClient.tsx`.
- [x] Ajustar o estilo da barra de tabs para o padrão linear com underline.
- [x] Atualizar ou criar testes do hero conforme o novo layout.
- [x] Rodar lint do frontend.
- [x] Rodar typecheck do frontend.
- [x] Rodar testes focados no hero/company detail ou documentar bloqueio.

## File List
- [x] `components/AppBreadcrumb.tsx`
- [x] `app/companies/[id]/CompanyDetailClient.tsx`
- [x] `app/companies/[id]/components/CompanyHero.tsx`
- [x] `__tests__/app/companies/CompanyHero.test.tsx`
- [x] `__tests__/components/AnalyticsIntegration.test.tsx`
- [x] `docs/stories/STORY-2026-02-27-company-detail-deel-header-alignment.md`

## Validation
- [x] `npm run lint` (passou; restam warnings preexistentes de hooks e `no-img-element` fora deste ajuste)
- [x] `node --max-old-space-size=4096 .\node_modules\typescript\bin\tsc --noEmit`
- [x] `npm test -- CompanyHero`
- [x] `npm test -- AnalyticsIntegration`
- [ ] `npm test` (bloqueado no estado atual do repo por estouro de memória do Jest e falhas `TransformStream is not defined` nas specs com Playwright)
- [ ] `npm run build` (bloqueado no ambiente atual por falhas de fetch no sitemap durante o build e estouro de memória dos workers do Next)
