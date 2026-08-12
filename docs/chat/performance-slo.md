# Performance/SLO Chat

Eventos `chat_assistant_response_generated` registram `retrieval_time_ms`, `ttft_ms`, `full_response_time_ms`, `latency_ms`, modelo e tokens.

Metas: disponibilidade >= 99.9%, TTFT p75 < 1.5s, resposta completa p75 < 5s, erro < 1%. Logs usam duração e session id; não registram conteúdo ou PII.
