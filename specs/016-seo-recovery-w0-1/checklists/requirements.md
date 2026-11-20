# Checklist de Requisitos — W0.1

- [x] O escopo não altera layout da Brand Page.
- [x] Não há migration ou mutação de produção.
- [x] 404 confirmado é distinguido de falha upstream.
- [x] Canonical da home não é usada para empresa inexistente.
- [x] `robots.txt` possui fonte única no Next Metadata Route.
- [x] Testes HTTP finais foram especificados.
- [x] TLS/proxy possui runbook, backup e rollback.
- [x] O gate CI é obrigatório para código não documental.
- [ ] CI W0.1 executado com sucesso (pendente de execução remota).
- [x] Jest W0/W0.1 executado localmente: 3 suites e 17 testes aprovados.
- [x] YAML do workflow, lint estrito dos arquivos tocados e typecheck concluídos sem erro.
- [ ] RSpec local executado (ambiente sem Ruby/gems compatíveis).
- [ ] Build local concluído (worker excedeu 10 minutos sem saída).
- [ ] Produção revalidada após deploy autorizado.
