# Checklist de aceite e Definition of Done

## Correctness / P0
- [ ] SC→MT→SP com requisições fora de ordem termina apenas com cidades SP; 100 sequências sem falhas.
- [ ] Nenhuma espera artificial 300ms/throttle 500ms na seleção; cache imediato; sem flash de cidades antigas.
- [ ] Reabertura e navegação sem fetch redundante por UF/revisão válida; cancelamento não afeta consumidor concorrente.
- [ ] Catálogo oficial separado de sede, presença e cobertura; paridade de resultados e URLs; empresas inativas excluídas conforme contrato.
- [ ] `/count` coerente ou fallback neutro; zero retries 404 e zero chamadas à rota inexistente.
- [ ] Primeiro hit Rails após readiness medido; sem inicialização pesada na requisição.

## Security / cache
- [ ] ETag/304 e cache público apenas nos GETs anônimos allowlisted; auth/cookie/Set-Cookie/mutações/erros no-store.
- [ ] Cache keys por UF/revisão e variantes; testes cache poisoning e isolamento de sessão aprovados.
- [ ] SW não armazena respostas inválidas, não altera caches privados, offline warm/cold e upgrade testados.
- [ ] Nenhum secret, PII ou GPS em logs/artefatos; consentimento analytics respeitado.

## UX / performance
- [ ] Geometria 44px ±1, 4 colunas, 70vw ±1px; snapshots 320/375/390/430/768/1024/1280px sem regressão.
- [ ] Loading, error/retry, empty e offline acessíveis, foco preservado, reduced motion.
- [ ] SP/MG e multi-UF com busca sem acento e janela ≤60 opções; seleção correta.
- [ ] Metas NFR01–NFR15 medidas conforme quickstart; exceções justificadas e aprovadas, não mascaradas.
- [ ] Bundle delta ≤5 KB gzip ou desvio aprovado; sem catálogo completo no JS crítico.
- [ ] Índices apenas se EXPLAIN representativo justificar; migration concorrente, reversível, rollback validado.

## Release / DoD
- [ ] FR/NFR rastreados a tasks e testes; RED→GREEN documentado.
- [ ] Jest/RSpec/Playwright/lint/typecheck/build e scans aplicáveis verdes sem bypass/forceExit.
- [ ] SHA/release consistentes; PR, workflows, smoke staging e rollback com evidência; produção somente se autorizada.
- [ ] Sem alteração indevida das specs 011/014/018, MCP ou layout; sem OOM ou regressão de recursos atribuível.
- [ ] Relatório final com baseline/after, amostras, riscos, flags, status de deploy e blockers explícitos.
