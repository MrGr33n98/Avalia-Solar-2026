# Avalia Solar — Comparador, recomendações compactas V2

Status: implementação proposta em PR isolada. Revisar CI/Playwright antes de merge.
Data: 2026-11-20. Escopo: `/compare`, PWA + WebApp.

## PRD / histórias de usuário

- Como visitante mobile, quero examinar até oito empresas recomendadas numa grade 2x4, mantendo nome, logo, categoria, cidade/UF, nota (quando existe), verificação e ação.
- Como visitante com vagas na seleção, quero adicionar uma empresa sem mudar os limites do comparador.
- Como visitante com o limite atingido, quero substituir a empresa selecionada via sheet no mobile e dialog no desktop.
- Como operador, quero que a descoberta respeite dados reais e deduplique empresas antes de ordenar e selecionar até oito itens.

## DDD / regras de domínio

1. **Recomendações != seleção de comparação**: `COMPARE_RECOMMENDATION_LIMIT = 8` é capacidade da descoberta. `COMPARISON_LIMITS.mobile = 2` e `COMPARISON_LIMITS.desktop = 3` são limites da operação de comparar e permanecem intocados.
2. Preservar a seleção e seus IDs vindos do servidor, sem confiar em dados comerciais enviados pelo navegador.
3. Excluir selecionadas e candidatos duplicados. Não recomendar entidades financeiras para comparações sem contexto financeiro. Preservar a ordenação existente por cidade/categoria, verificação, avaliações e sinais definidos pelo domínio.
4. A requisição retorna candidatos reais ativos. Em contexto regional/categoria com menos de oito candidatos, consultar também a lista geral, deduplicando; se fallback falhar, preservar a resposta regional já obtida.
5. Não criar dados fictícios, notas fictícias, selos fictícios ou orçamento para plano que não possua acesso.

## Design / geometria

| Região | Regra |
|---|---|
| 320–1279px | Duas colunas de mesma largura na seção de recomendações |
| >=1280px | Uma coluna na sidebar atual de 300px |
| Gaps | 8px horizontal e vertical |
| Padding seção | 12px mobile, 16px acima de sm |
| Padding card | 8px mobile, 10px acima de sm |
| Card | Altura mínima 168px (mobile) / 160px (sidebar), sem altura máxima |
| Logo | 32px mobile, 36px sm, 40px xl; `object-fit: contain` |
| Nome | Máximo visual de 2 linhas; nome completo no DOM e atributo title |
| Categoria/localização | 11px; elipse em caso de overflow, sem quebrar o grid |
| Ação | Botão mínimo 44px de altura; texto Adicionar/Substituir permanece acessível |

O layout deve crescer com texto ampliado sem cortar ação. O mockup é referência visual; não é fonte de dados de empresas.

## Testes e evidências

### TDD / contrato de componentes

- `AB0-1-front/__tests__/components/RecommendedCompaniesCompact.test.tsx`: 8 cards, grid, conteúdo, botão 44px, adição, substituição, skeletons, erro, empty.
- `AB0-1-front/__tests__/components/RecommendedCompanies.test.tsx`: contratos existentes de mobile 2, desktop 3.
- `AB0-1-front/__tests__/components/ComparePwaCarbonLayout.test.tsx`: preservar composição da página e regras de comparação.

### DDD / integração de dados

- `AB0-1-front/components/compare/__tests__/recommendations-grid-domain.test.ts`: limite 8, unicidade, exclusão, elegibilidade e ranking.
- `AB0-1-front/components/compare/__tests__/compare-insights.test.ts`: regressão de regras existentes.
- `AB0-1-front/components/compare/__tests__/useCompareDiscovery.test.tsx`: busca contextual + fallback, deduplicação, erro parcial e consulta global.

### E2E / regressão geométrica e evidência visual

- `AB0-1-front/tests/e2e/compare-recommendations-compact.spec.ts`: executa em Chromium com fixtures interceptadas no navegador; viewports 320, 360, 375, 390, 414, 430, 768, 1024, 1280; valida colunas, zero overflow horizontal, toque >=44px e ação Adicionar.
- Capturas PNG de 390px e 1280px anexadas ao relatório Playwright do CI para revisão humana; sem baseline de pixel-diff aprovada nesta fase.

### GitHub Actions

- `.github/workflows/comparison-v2-contract-gate.yml`: TypeScript e Jest com todas as suítes de comparação relevantes; Rails contracts mantidos.
- `.github/workflows/ci-web-backend.yml`: teste Playwright incluído na suíte crítica e também contemplado na execução completa periódica.
- Não habilitar `continue-on-error` para esses testes. Não executar deploy até a PR estar verde e ser revisada.

## Definition of Done

- Nenhuma alteração dos limites 2/3 nem dos gates de conversão pagos.
- Todos os novos testes e gates existentes aprovados na PR.
- Playwright sem overflow horizontal, sem sobreposição e com botão operável em todos os viewports.
- Capturas do CI revisadas contra o mockup aprovado.
- Nenhum dado inventado para preencher oito cards; número visível pode ser inferior a oito quando elegibilidade permitir.
- Merge condicionado a aprovação explícita do CI e revisão visual.
