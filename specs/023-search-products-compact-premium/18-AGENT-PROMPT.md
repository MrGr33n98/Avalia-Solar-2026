# GOAL: AVALIA SOLAR — SEARCH PRODUCTS COMPACT PREMIUM A+++

MODE: READ-ONLY DISCOVERY FIRST → DESIGN-DRIVEN DEVELOPMENT → TDD → IMPLEMENTATION → VERIFICATION

## MISSÃO

Redesenhar exclusivamente a seção de produtos do mecanismo de busca do Avalia Solar, tornando a experiência significativamente mais compacta, premium, responsiva e eficiente, sem perder informações válidas, funcionalidades, integridade comercial ou performance.

A solução deverá funcionar para qualquer termo de pesquisa, marca, categoria, localização, ordenação e quantidade de produtos.

URL de referência:

https://www.avaliasolar.com.br/search?q=goodwe&sort=rating&page=1

## ETAPA 1 — DISCOVERY READ-ONLY

Antes de modificar qualquer arquivo:

- Identificar todos os consumidores de ProductCardEnhanced.
- Inventariar componentes, dependências, tokens, estilos, breakpoints e contratos.
- Validar as causas raiz documentadas.
- Capturar screenshots desktop, mobile e PWA.
- Medir geometria real por getBoundingClientRect.
- Registrar baseline de performance, bundle, requests, LCP e CLS.
- Inventariar testes existentes.
- Validar a origem das informações de reputação, verificação, preço e parcelamento.
- Identificar a SPEC disponível para este trabalho.
- Entregar diagnóstico, GAP Analysis, Quick Wins e plano de implementação.

## ETAPA 2 — DESIGN-DRIVEN DEVELOPMENT

Utilizar como referências conceituais IBM Carbon, Swiss Design e interfaces enterprise de alta densidade.

Preservar a identidade visual oficial do Avalia Solar.

Implementar uma variante compacta isolada para ProductCardEnhanced, inicialmente utilizada somente em /search.

Metas:

- Redução mínima de 35% da altura do card de referência.
- Altura alvo de 280–340 px no desktop, com crescimento quando necessário para preservar conteúdo.
- Imagem com altura controlada entre 128–152 px.
- Padding de 12 px.
- Gap de 12 px.
- Border radius de 8 px.
- Grid adaptativo baseado na largura útil.
- Três colunas na área útil de aproximadamente 840 px.
- Sem expansão indevida quando existir somente um produto.
- Sem truncamento que torne informações essenciais inacessíveis.
- Sem deformação de imagens.
- Sem novas dependências.
- Sem alteração global do design system.

Preservar categoria, nome, marca, fornecedor, avaliação, quantidade de avaliações, verificação, preço, favoritos e CTA.

Exibir condições de parcelamento apenas quando respaldadas por dados comerciais válidos.

Identificar corretamente quando a reputação e a verificação pertencem à empresa, e não ao produto.

## ETAPA 3 — TDD

Escrever os testes antes da implementação.

Executar RED → GREEN → REFACTOR.

Cobrir estados de 0, 1, 2, 3, 4, 8 e 24 resultados, imagens ausentes ou inválidas, nomes extensos, preços ausentes, condições comerciais, favoritos, filtros, ordenação, autenticação, acessibilidade e responsividade.

Implementar testes unitários, de integração, Playwright E2E e visual regression utilizando a infraestrutura existente.

## ETAPA 4 — IMPLEMENTAÇÃO

Priorizar:

- SearchPageClient.tsx
- ProductCardEnhanced.tsx
- Componentes e estilos exclusivos da seção de produtos.
- Testes correspondentes.

Preservar os consumidores externos de ProductCardEnhanced.

Não alterar indiscriminadamente ProductCard.tsx, globals.css, backend Rails, endpoints, ranking, filtros geográficos ou mecanismos de entitlement.

Não utilizar dados fictícios.

Não adicionar JavaScript para calcular dimensões que podem ser resolvidas por CSS.

Não aumentar o bundle sem justificativa.

## ETAPA 5 — VERIFICATION

Executar lint, typecheck, testes unitários, integration tests, Playwright, build e pipeline CI aplicável.

Comparar AS-IS e TO-BE com evidências reais.

Apresentar screenshots antes e depois em todas as resoluções relevantes.

Validar ausência de regressões no catálogo, Brand Pages, favoritos, filtros, ordenação e analytics.

Validar LCP ≤ 2,5 segundos, INP ≤ 200 ms e CLS ≤ 0,1 como objetivos de performance, documentando condições de medição e eventuais limitações.

## DEFINITION OF DONE

Considerar a missão concluída somente quando:

- A variante compacta estiver funcional.
- Todas as informações válidas estiverem preservadas.
- A redução geométrica estiver comprovada.
- O grid estiver responsivo.
- Os testes estiverem aprovados.
- Nenhuma regressão conhecida tiver sido introduzida.
- A integridade comercial estiver validada.
- O build estiver aprovado.
- A documentação estiver atualizada.
- As evidências visuais estiverem anexadas.
- O rollback estiver documentado.

Não declarar conclusão sem evidências.

Entregar o relatório final contendo arquivos modificados, causas raiz resolvidas, resultados dos testes, métricas antes e depois, screenshots, riscos residuais e status de readiness para produção.

## Fonte de verdade
Ler README e documentos 01–17, 19–21, assets e decisões complementares em 08/15/17. O mockup é ilustrativo. Confirmar número da SPEC e SHA em W0. Reportar bloqueios sem inventar dados ou declarar execução não realizada.
