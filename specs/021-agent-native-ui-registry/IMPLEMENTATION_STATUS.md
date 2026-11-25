# Spec 021: status de implementação (MVP W0–W7)

**Data:** 2026-11-25 · **Branch:** `feat/spec-021-agent-native-ui-registry` (worktree isolado) · **Base:** `origin/main` `3a823f410`
**Executor:** agente (Claude Code). Esta página é a fonte do status. Os demais documentos desta pasta são o pacote de especificação original, copiado sem alterações (o `SHA256SUMS.txt` confere).

Legenda: **PASS** (executado e verde) · **FAIL** · **BLOCKED** (impedido por acesso ou ambiente) · **NOT RUN** (não executado) · **PARTIAL** (parte entregue, lacuna descrita).

## 1. Matriz de critérios de aceite

| Gate | Status | Evidência | Observação |
|---|---|---|---|
| AC01 Regressão funcional | PASS | `evidence/final/e2e.txt` (37/37), `evidence/final/unit.txt` (46/46) | Os 18 E2E de baseline continuam verdes; IntegratorCard e SourceNote viraram adaptadores |
| AC02 Compatibilidade | PASS | `git diff origin/main -- packages/mcp-ui/package-lock.json` vazio | React 18, Vite 6, Zod 4 e ext-apps ^2.0.4 sem mudança; nenhuma dependência nova no pacote produtivo |
| AC03 Bundle ≤ 122880 B gzip | PASS (margem crítica) | `evidence/final/budget.txt`, `evidence/final/manifest-after.json` | categories 122748 B (**132 B de margem**); nenhum processo novo na VM |
| AC04 UX/a11y | PARTIAL | `evidence/w7/e2e-playground.txt`, `evidence/w7/screenshots/` | Blocos: 8 larguras × 2 temas sem overflow do frame e axe sem serious/critical. Zoom 200% não testado. A tabela em 390 px quebra palavras (pré-existente) |
| AC05 Dados | PASS | `tests/unit/registry-blocks.spec.tsx` | IDs estáveis, nota nula ≠ 0, ações ausentes ocultas, sem preço/estoque/EUR, fixtures fora do runtime (teste `registry-playground.spec.ts`) |
| AC06 Fluxos | PASS | unit + E2E `search -> compare` | Limite 2–3 por ID; cursor/ordenação não alterados (código de SearchWidget intacto fora da lista) |
| AC07 Registry | PASS | `evidence/w7/install-test.json`, `evidence/w7/registry-generated-index.json` | 9 itens, validador 6/6, `shadcn build` 4.13.0, **3 instalações em sandbox com `tsc` verde** |
| AC08 Contrato | PASS | sem mudança em `schemas.ts`/Rails | Envelope v1 intacto. Profile V2: continua servindo `profile.v1.html` (ver §5) |
| AC09 Segurança | PASS (escopo UI) | validador (traversal, segredos, fixtures, sourcemaps), sem mudança de CSP/OAuth/Pundit | Nenhuma tool nova, nenhuma mutação |
| AC10 Hosts | PARTIAL | harness E2E verde | Host real (ChatGPT/Claude) **NOT RUN**, sem autorização nem ambiente nesta execução |
| AC11 Evidência | PASS | `evidence/` (caminhos locais redigidos) | REA não executado nesta spec (ver §6); nenhum sourcemap ou segredo versionado |
| AC12 Entrega | PARTIAL | PR draft + CI | Drill em staging **NOT RUN** (sem autorização). Rollback documentado em §7 |

## 2. Tarefas

| Wave | Tarefa | Status | Evidência / commit |
|---|---|---|---|
| W0 | T001 inventário/worktree | PASS | worktree `../avalia-solar-spec021`; `main` local em outra branch (PR #240) intocado; Spec 020 untracked preservada |
| W0 | T002 versões/engines/licença | PASS | Node 22.23.5; shadcn 4.13.0 (`node >=20.18.1`); mcpcn MIT |
| W0 | T003 registry upstream | PASS | `evidence/w0/mcpcn-lab.txt`: commit `538fa792`, 33 itens (30 blocos), sha256 por item |
| W0 | T004 baseline | PASS (Rails NOT RUN) | `evidence/w0/*`: typecheck OK, 29 unit, build, 18 E2E. RSpec: sem Ruby no host; container de dev compartilha DB com risco (Spec 019) |
| W0 | T005 gzip/screenshots | PASS | `evidence/w0/budget-baseline.txt`; screenshots baseline sobrescritos pelo Playwright (não preservados) |
| W0 | T006 019/020 e segredos | PARTIAL | 020 untracked preservada no worktree principal. Revogação de credenciais é ação humana pendente |
| W0 | T007 laboratório shadcn | PARTIAL | `add @mcpcn/product-list` e `@mcpcn/table` OK; `init` falhou no npm install (ETIMEDOUT); build do preview falhou na tipagem da API composta do `table` |
| W1 | T008–T010 tokens | PASS | `c37742e55` escala 4 px e tipografia aditivas; aliases `--as-*` intactos |
| W1 | T011 container query do frame | PASS (RED→GREEN) | `evidence/w1/geometry-red.txt` (12 px em todas as larguras) → verde em `final/e2e.txt` |
| W1 | T012 baseline × candidato | PARTIAL | Diferença visual intencional: padding 16/18/24 px; captura lado a lado não preservada |
| W2 | T013–T015 primitives | PARTIAL | Exports reaproveitados via `as-primitives`; sem renomear para AS* (evitar bytes/aliases sem consumidor) |
| W2 | T016 imagens/URLs inválidas | PASS (pré-existente) | `bridge-primitives.spec.tsx`, `public-media-gallery.spec.tsx` |
| W2 | T017 gate bundle/a11y | PASS | `final/budget.txt`, axe |
| W3 | T018–T019 SolarCompanyCard/List | PASS | `480aea3d6` |
| W3 | T020–T023 filtros/categorias | NOT RUN | Não extraídos: sem margem de bundle em categories/search (132/592 B) |
| W3 | T024 E2E search→compare | PASS | E2E existente |
| W4 | T025–T031 brand/catálogo | NOT RUN | Sem margem de bundle em profile; BrandHero e CatalogPreview mantidos |
| W5 | T032–T035 compare | PASS | CompanyComparisonTable com remoção reversível (`Restaurar empresas removidas`) |
| W6 | T036–T039 reputação/evidência | PASS | ReviewDistribution, EvidenceCard (sem ID fictício; `evidence_id` aguarda contrato da 020) |
| W7 | T040–T042 registry | PASS | `183329554`, install-test 3/3 |
| W7 | T043–T044 playground/matriz | PASS | `228562377`, `9303dd8d9`; 14 E2E do playground |
| W7 | T045 relatório e PR draft | PASS | este arquivo + PR |
| W7 | T046 staging/host real | NOT RUN | Sem autorização |

## 3. Métricas antes/depois (gzip nível 9, `check-bundle-budget.py`)

| Superfície | Antes (B) | Depois (B) | Δ | Margem final |
|---|---:|---:|---:|---:|
| search | 122135 | 122288 | +153 | 592 |
| profile | 121513 | 121484 | −29 | 1396 |
| reputation | 117534 | 117512 | −22 | 5368 |
| compare | 118065 | 118019 | −46 | 4861 |
| categories | 122567 | 122748 | +181 | **132** |

Testes: unit 29 → 46; E2E 18 → 37; registry (`node --test`) 0 → 6.
Composição do bundle `search` (antes de minificar): `@modelcontextprotocol/client` 28%, zod 32% somado, react-dom 16%, código próprio cerca de 8%. O ext-apps só importa `Protocol` do client, mas o chunk do SDK declara centenas de schemas zod no topo do módulo. `treeshake.manualPureFunctions` não reduziu (medido). **Recomendação:** abrir issue upstream ou avaliar o entry `app-with-deps`; é o único caminho para ganhar margem relevante.

## 4. Decisões tomadas na execução

1. `modulePreload.polyfill: false` (código morto no singlefile) foi necessário para caber no orçamento sem aumentar o limite.
2. Os tokens tipográficos guardam só `tamanho/altura`; o peso fica na classe. Isso evita repetir `var(--as-font)` e mede menos bytes.
3. `EvidenceCard` não exibe `evidence_id` até a Spec 020 aprovar o contrato (COMPONENT_CONTRACTS).
4. O item `as-host-bridge` está no registry como `distribution: internal`. É o adaptador público do ext-apps, sem segredos, necessário para `as-primitives` (LinkButton/AppFrame).
5. `primitives.tsx` passa a importar `blocks/EvidenceCard` (adaptador `SourceNote`). É uma inversão pequena e documentada, sem ciclo: EvidenceCard não importa nada do design.

## 5. Profile V2 (AC08)

`Mcp::Ui::ResourceRegistry::PROFILE_V2` faz merge só da `uri` sobre a entrada v1. Por isso `ui://avalia-solar/profile/v2.html` serve o mesmo `profile.v1.html`, com seções condicionadas pelas flags `MCP_BRAND_PROFILE_*`. Nada foi alterado. Arquivo próprio para v2 continua sendo decisão pendente (Spec 020 G-06).

## 6. Ferramentas

| Recurso pedido | Uso real |
|---|---|
| shadcn MCP | **Não disponível nesta sessão** (nenhuma tool `mcp__shadcn*`). Usei o CLI `shadcn@4.13.0 search/view/add/build`, que consulta os mesmos registries |
| mcpcn registry | snapshot + `add` em sandbox |
| Playwright | MCP não usado; Playwright Test do pacote |
| REA | NOT RUN nesta spec. A Spec 020 mostrou custo alto (até 748 MB, sem semântica); os gates primários são Playwright/axe (D08) |
| Astryx / IBM Carbon / Storybook MCP | Não usados; não necessários para o MVP e sem justificativa para importar frameworks (GOAL) |

## 7. Rollback

- **Código:** a PR não está mergeada. Basta fechar a PR. Depois de um merge, `git revert` dos commits na ordem inversa. Cada commit é independente, exceto o `9303dd8d9`, que depende de `228562377`.
- **Runtime:** nenhuma flag, rota, tool ou config Rails mudou. O rollback de produção é o deploy padrão da imagem anterior (`cd-production` já tem rollback automático).
- **Registry/playground:** não são publicados nem empacotados; removê-los não afeta o runtime.

## 8. Pendências

1. Margem de bundle crítica (categories 132 B): qualquer extração de W3 (filtros) e W4 (brand) precisa antes de uma redução upstream de `@modelcontextprotocol/client`.
2. Host real (ChatGPT/Claude) e drill em staging: precisam de autorização.
3. RSpec MCP local: precisa do stack de teste isolado; o CI cobre na PR.
4. Tabela de comparação em ≤ 390 px: quebra de nome e nota no meio da palavra (pré-existente).
5. E2E do mcp-ui não roda no CI hoje (só `verify`). Recomenda-se um job com `build:playground` + `playwright test`.
6. Revogar e rotacionar as credenciais expostas em logs anteriores (ação do responsável).
7. Laboratório mcpcn: completar o `init` (rede) e o preview tipado do `table`.
