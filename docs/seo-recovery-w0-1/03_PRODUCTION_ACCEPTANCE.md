# W0.1 — Critérios de Aceite e Evidências

| ID | Critério | Evidência exigida | Estado neste branch |
|---|---|---|---|
| AC-01 | `/robots.txt` anuncia `sitemap-index.xml` | E2E HTTP final + produção pós-deploy | Teste criado; produção pendente |
| AC-02 | Não há fonte estática conflitante | ausência de `AB0-1-front/public/robots.txt` + build | Implementado; validação pendente |
| AC-03 | TLS apex cobre hostname | `openssl s_client` no proxy ativo | Infra pendente |
| AC-04 | Apex responde 308 para `www` | `curl -I` sem ignorar TLS | Infra pendente |
| AC-05 | Empresa inexistente responde 404 | E2E HTTP real | Teste criado; produção pendente |
| AC-06 | 5xx/timeout não viram ausência | Jest + RSpec/HTTP equivalente | Implementado/teste criado |
| AC-07 | Empresa existente preserva 200/canonical | E2E Brand Page | Validar no CI/produção |
| AC-08 | Gate W0 obrigatório | workflow e `verify-smart-ci-gate.sh` | Implementado; CI pendente |
| AC-09 | Nenhuma mutação de produção | revisão de diff/auditoria de comandos | Deve ser confirmado na PR |

A W0.1 somente poderá ser classificada como `W0 PRODUCTION VALIDATED` após o deploy autorizado e a repetição das verificações de produção, incluindo TLS/proxy.

## Validação local desta branch

- Jest W0/W0.1: **PASS** — 3 suites, 17 testes.
- Smart CI Gate: **PASS** — todos os cenários do contrato.
- YAML do workflow: **PASS**.
- Lint estrito dos arquivos frontend tocados: **PASS**, com um warning preexistente de `dangerouslySetInnerHTML`.
- Typecheck: encerrou sem erros visíveis.
- RSpec: **NOT EXECUTED** — host sem Ruby e imagens Docker locais sem gems completas.
- Build: **NOT COMPLETED** — compilação local excedeu 10 minutos sem emitir erro; o processo local foi encerrado.
