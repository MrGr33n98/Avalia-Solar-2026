# Carga controlada de Banner Ads

Requer [k6](https://grafana.com/docs/k6/latest/). Executar somente em ambiente de teste/staging:

```bash
BANNER_BASE_URL=http://localhost:3001 \
BANNER_ID=1 \
BANNER_RATE=10 \
BANNER_DURATION=30s \
k6 run scripts/load/banner-events.k6.js
```

Gates padrão:

- taxa de erro `< 1%`;
- p95 HTTP `< 500 ms`;
- checks aceitos `> 99%`.

O cenário usa `constant-arrival-rate`, gera `impression_instance_id` único e mantém tags sem tenant, IP ou URL. Não executar contra produção sem aprovação explícita e janela de carga.
