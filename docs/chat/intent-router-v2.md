# Intent Router V2

Router mantém regras determinísticas de alta confiança. Contrato retorna `primary_intent`, `secondary_intents`, `confidence_score` e `router_source` (`rule`, `classifier` ou `fallback`).

Context carry-over usa sessão como extensão futura; nenhuma decisão automática substitui regra de alta confiança. Multi-intent preserva intenção principal e lista secundária.
