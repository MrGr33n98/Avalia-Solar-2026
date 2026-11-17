# Avalia Solar — Empresas Relacionadas em grid compacto (IBM-inspired)

**Rota:** Brand Page, aba Visão Geral — `/companies/[id]`  
**Escopo:** PWA/mobile web (320–430px), tablet e web (>=768px). Sem alteração de API, Rails, banco, planos ou lógica de recomendação.

## Root cause no código

- `RelatedCompaniesTable.tsx` tinha `mt-8 pt-8 space-y-6`, enquanto `OverviewTab.tsx` já aplicava `space-y-6` e o carrossel tinha `mt-8`, somando espaços entre as duas superfícies.
- O cabeçalho da listagem tinha `flex-col sm:flex-row`, `gap-4`, `pb-4` e seletor `w-[130px]`, criando uma segunda linha com espaço em branco no PWA.
- Desktop renderizava uma tabela com colunas próprias; mobile criava cards separados, `p-4`, `rounded-[20px]`, rank/localização em linhas e CTA com `mt-4`, aumentando a densidade vertical.
- O checkbox de comparação já era controlado por `ComparisonToggleButton`; era necessário preservar o mesmo handler e os limites do store, sem inventar outro estado.
- O CTA `QuoteCTA` usa `canUsePaidConversion(company, 'quote')` e `openLeadModal`; não pode aparecer para empresas não elegíveis.

## Implementação

- **Renderização única** de cada empresa em linha responsiva: grid de 3 áreas, logo **40px** (44px no web), identificação e comparação com alinhamento vertical.
- **Linha alvo:** altura mínima 76px mobile / 80px web, com crescimento automático para nomes longos ou para a ação de orçamento quando elegível.
- **Nome:** 13px mobile / 14px desktop, sem truncamento silencioso, quebra somente quando necessária; rank na mesma linha, verificação real, localização e avaliação em segunda linha.
- **Seletor:** header alinhado desde 320px; `10/pág.` em 98px mobile / 112px desktop, controle 44px e opção real de 5, 10, 20 por página.
- **Contêiner:** borda única e `divide-y` entre linhas, `rounded-xl` 12px, sem card individual e sem sombras pesadas.
- **Espaçamento:** bloco carrossel/lista em `space-y-3`, removido `mt-8` da versão de resultados do carrossel e `mt-8/pt-8` da tabela.
- **Ações:** comparação em todas as linhas usando componente canônico; orçamento somente com autorização. Em telas estreitas, orçamento entra na área de detalhes; no desktop, alinha com comparação à direita. Não há duas ações visíveis simultaneamente.
- **Paginação:** página ativa e faixa numérica mantidas, scroll horizontal restrito à faixa de páginas; labels acessíveis, alvos 44px e scroll de volta à seção.
- **Acessibilidade:** role=list/listitem, título referenciado, rótulos e foco preservados; classificação e ordenação dos dados não mudam.

## User story e aceite

> Como visitante navegando empresas relacionadas no iPhone ou desktop, quero comparar integradores sem perder espaço da tela e sem que os botões saiam do grid, mantendo todos os dados e ações úteis.

1. Título e seletor se alinham sem criarem uma faixa separada desnecessária em 320/375/390/430px.
2. Linha mantém logo, ranking, nome, localização, status de avaliações e comparar, sem overflow horizontal.
3. Verificação somente aparece quando comprovada nos dados.
4. Paginação muda 5/10/20, começa na página 1 após alteração e mantém links/rank absolutos.
5. Gating `quote` impede CTA em plano não elegível e `openLeadModal` recebe empresa/source/type corretos.
6. Lista vazia não fabrica empresas.
7. Carrossel protegido (planos pagos) e estados error/loading/empty continuam como antes.
8. PWA Safari e desktop sem duas tabelas/cards distintos.
9. Smoke visual em 320, 375, 390, 430, 768, 1024 e 1440px; conferir zoom 200% e labels grandes.
10. Screenshot antes/depois e altura em pixels devem ser medidos no navegador real; nenhum ganho percentual foi confirmado apenas pelo CSS.

## Testes implementados

- `RelatedCompaniesTable.spec.tsx`: grid único, links, logotipo, verificação, ratings, paginação, alteração de page size e gating comercial.
- `RelatedCompaniesCarousel.spec.tsx`: modos protected/results/loading/error/empty existentes preservados.
- CI frontend: etapa `Run Related Companies compact layout regression` no job `Ranking Performance Frontend Contract`, com TypeScript e demais gates já existentes.

**Rollback:** reverter PR e publicar novamente frontend. Não há migrations.
