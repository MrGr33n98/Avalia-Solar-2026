# Tasks — SEO Recovery W0.1

- [ ] T001 Confirmar branch, estado do working tree e preservação de arquivos não relacionados.
- [x] T002 Remover a fonte estática conflitante de `robots.txt`.
- [x] T003 Preservar `app/robots.ts` como fonte única e manter o sitemap index.
- [x] T004 Diferenciar 404 confirmado de 5xx/timeout/rede no resolver público de empresas.
- [x] T005 Declarar metadata de ausência sem canonical enganosa para Brand Pages.
- [x] T006 Adicionar contratos Jest para 404, 503 e timeout.
- [x] T007 Adicionar E2E HTTP para robots e soft 404.
- [x] T008 Criar job obrigatório `SEO W0 Regression Gate`.
- [x] T009 Integrar o resultado do job ao Smart CI Gate sem permitir skip em código.
- [x] T010 Executar Jest W0.1 e contratos W0 existentes (3 suites, 17 testes).
- [ ] T011 Executar RSpec `company_spec` e `sitemaps_spec`.
- [ ] T012 Executar build/typecheck/lint e validar YAML do workflow (typecheck, lint e YAML passaram; build local excedeu 10 minutos sem concluir).
- [ ] T013 Revisar e publicar o runbook de TLS/proxy sem aplicar infraestrutura.
- [ ] T014 Repetir validação de produção após publicação autorizada.

> T011 está bloqueada apenas pelo ambiente local: o host não possui Ruby e as imagens Docker disponíveis não têm todas as gems do lockfile. O CI deve executar esse contrato em ambiente limpo.
