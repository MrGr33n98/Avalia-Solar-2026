# Modelo de evidência
- ID, hipótese/tarefa/teste, SHA source e deploy, ambiente, perfil/viewport/rede/CPU, papel/plano e tenant sintético, data/hora.
- Passos de reprodução e expected/actual; referência a trace sanitizado, bundle report, screenshot ou log redigido; hash do arquivo quando aplicável.
- Baseline e candidato, unidade, amostra, p50/p75/p95 quando justificável, variação, fatores concorrentes.
- Estado: UNTESTED / CONFIRMED / REFUTED / INCONCLUSIVE / BLOCKED. Limitações e próximos passos. Não simular números ou evidências; hash não prova veracidade.
- Inventário por componente: rota, tab, subtab, path, boundary server/client, parent, data dependencies, mount cost, render count, self/total time, chunk bytes, cache key (redigida), triggers, animation cost, states, gate, ação, evidência.
