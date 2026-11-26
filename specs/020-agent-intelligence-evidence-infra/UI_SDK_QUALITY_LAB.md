# Spec 020 — UI SDK QUALITY LAB

Ambiente padronizado para gerar **evidência** dos widgets MCP Apps (e, por extensão, da PWA da Spec 019) sem dados de clientes e sem tocar em staging ou produção.

## 1. O que já foi provado nesta auditoria

| Passo | Comando REA | Resultado | Fato |
|---|---|---|---|
| Servir `dist/` em loopback | `python3 -I -m http.server 8765 --bind 127.0.0.1` | OK | — |
| Chrome headless com CDP | `google-chrome --headless=new --remote-debugging-port=9333 --remote-debugging-address=127.0.0.1` | Chrome 151 | F-45 |
| Descobrir alvo | `rea list-browser-targets http://127.0.0.1:9333` | 1 page, título "Avalia Solar — Integradores" | — |
| WebMCP | `rea discover-webmcp-tools …` | 0 tools (esperado) | F-46 |
| Inspeção passiva | `rea inspect-web-page …` | 59 nós DOM, 0 rede | F-47 |
| Screenshot | `rea capture-web-screenshot …` ×4 | PNG + `ev_…` por superfície | F-48 |
| Bundle | `rea analyze-web-bundle … --view '{"kind":"web-bundle","collection":"summary"}'` | deadline de 30 s por script | F-45 |

**Conclusão:** a cadeia CDP → REA funciona em loopback. O que falta é **(a)** um host real que entregue `toolResult` ao widget (sem isso o widget fica em skeleton, F-48) e **(b)** um artefato JS analisável (RCA-1).

## 2. Arquitetura do lab

```
fixtures (packages/mcp-ui/src/fixtures/staging-fixtures.ts)
   │
   ▼
host de referência MCP Apps (loopback :4180)  ◄── iframe sandbox ──  dist/<surface>.v1.html (:8765)
   │  postMessage ui/initialize, tool-result(fixture), host-context(theme, safe-area, displayMode)
   ▼
Chrome headless CDP :9333
   │
   ▼
REA: capture-browser-scenario → capture-web-screenshot → compare-web-screenshots
     inspect-web-event-listeners (cliques), observe-web-session (navegação)
```

- **Host:** usar o host de exemplo do `@modelcontextprotocol/ext-apps` (dependência já presente, F-40) em modo loopback. **Não foi verificado** nesta auditoria se a versão `^2.0.4` publica esse host no pacote npm; T-031 confirma. Alternativa: promover o host simulado de `widgets.spec.ts` (F-73) a uma página estática `lab/host.html`.
- **Matriz:** 5 superfícies (+ profile v2 por flag) × tema {light, dark} × displayMode {inline, fullscreen} × viewport {390×844, 780×493, 1280×800} = até 72 capturas. Fase 3 começa com 5 × 2 × 1 × 2 = **20**.

## 3. Cenários (input de `rea capture-browser-scenario`)

| Cenário | Superfície | Ação | Evidência esperada |
|---|---|---|---|
| L-01 render | todas | carregar + tool-result da fixture | screenshot ≠ skeleton; nenhum erro de console |
| L-02 tema | todas | trocar host-context para dark | screenshot dark; contraste via axe (já existente) |
| L-03 search→compare | search | selecionar 2, clicar em comparar | host recebe `tools/call compare_integrators` |
| L-04 erro | compare | tool-result com `isError` | estado de erro legível (`toUserReadableError`) |
| L-05 offline | profile | host sem resposta por 10 s | estado definido (hoje: skeleton infinito no standalone, G-08) |
| L-06 v1×v2 | profile | flags de brand ON | comparar screenshot v1 × v2 (G-06) |

Antes de rodar, cada cenário passa por `rea validate-browser-scenario`.

## 4. Comparação entre releases

1. O job baixa o artifact `evidence-bundle-<sha>` da última execução verde em `main`.
2. `rea compare-web-screenshots {left, right}` por cenário → idêntico, diferente ou indisponível.
3. `rea compare-artifacts` sobre os dois `manifest.json` → Δ de SHA e tamanho.
4. `rea compare-application-versions` sobre os grafos de `dist-analysis/`, só depois do RCA-1 resolvido.
5. O resumo vai para `$GITHUB_STEP_SUMMARY`. **Não bloqueia** o PR na fase 3; vira gate na fase 4, se a taxa de falso positivo for < 5% em 20 PRs.

## 5. Reuso para a Spec 019

O mesmo Chrome e o mesmo REA rodam contra `next build && next start` (não o dev server; RCA-4) em `127.0.0.1:3000`, com backend de teste do `docker-compose.test.yml` e seed sintético. Cenários: abrir `/companies`, selecionar UF, abrir a lista de cidades e repetir com cache quente. Isso desbloqueia T007/T042/T043 da 019 com evidência REA, além do Playwright existente.
