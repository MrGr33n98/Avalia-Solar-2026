# Performance/SLO Chat

`chat_assistant_response_generated` registra `retrieval_time_ms`, `ttft_ms`, `full_response_time_ms`, `latency_ms`, modelo e tokens.

Metas: disponibilidade >= 99.9%, TTFT p75 < 1.5s, resposta completa p75 < 5s, erro < 1%.

Contagem de empresas ativas usa cache de 10 minutos. Logs usam duração e session id; não registram conteúdo ou PII.
