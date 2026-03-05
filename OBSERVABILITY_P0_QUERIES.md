# 📊 OBSERVABILIDADE - DASHBOARD P0

## Logs Estruturados Implementados

### 1. Webhook Provider Rejection
**Localização:** `payments_webhooks_controller.rb:36-47`

**Campos:**
```json
{
  "event": "webhook_provider_rejected",
  "provider": "string",
  "ip": "IP address",
  "user_agent": "string",
  "timestamp": "ISO8601",
  "reason": "invalid_provider"
}
```

**Query (JSON logs):**
```bash
# Grep logs for rejected webhooks
grep '"event":"webhook_provider_rejected"' production.log | jq '.'

# Daily count by provider
grep '"event":"webhook_provider_rejected"' production.log \
  | jq -r '.provider' \
  | sort | uniq -c | sort -rn
```

### 2. API Performance Metrics (P95 per endpoint)

**Endpoints monitorados:**
- `review_dashboard#summary`
- `leads#mine`

**Campos:**
```json
{
  "event": "api_performance",
  "endpoint": "controller#action",
  "duration_ms": 123.45,
  "user_id": 123,
  "timestamp": "ISO8601"
}
```

**Query SQL (se usando APM database):**
```sql
-- P95 by endpoint (last 24h)
SELECT 
  endpoint,
  PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY duration_ms) as p95_ms,
  PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY duration_ms) as p50_ms,
  AVG(duration_ms) as avg_ms,
  COUNT(*) as request_count
FROM (
  SELECT 
    json_extract(message, '$.endpoint') as endpoint,
    CAST(json_extract(message, '$.duration_ms') AS REAL) as duration_ms
  FROM logs
  WHERE message LIKE '%"event":"api_performance"%'
    AND timestamp > datetime('now', '-24 hours')
) 
GROUP BY endpoint
ORDER BY p95_ms DESC;
```

**Query Bash (JSON logs):**
```bash
# P95 review_dashboard#summary
grep '"endpoint":"review_dashboard#summary"' production.log \
  | jq -r '.duration_ms' \
  | sort -n \
  | awk '{
      a[NR]=$1
    } END {
      print "P50:", a[int(NR*0.50)]
      print "P95:", a[int(NR*0.95)]
      print "P99:", a[int(NR*0.99)]
      print "Count:", NR
    }'

# P95 leads#mine
grep '"endpoint":"leads#mine"' production.log \
  | jq -r '.duration_ms' \
  | sort -n \
  | awk '{
      a[NR]=$1
    } END {
      print "P50:", a[int(NR*0.50)]
      print "P95:", a[int(NR*0.95)]
      print "P99:", a[int(NR*0.99)]
      print "Count:", NR
    }'
```

## Dashboards Recomendados

### Grafana/Loki Query
```logql
# Webhook rejections rate
rate({job="rails"} |= "webhook_provider_rejected" [5m])

# API P95 duration
histogram_quantile(0.95,
  sum(rate({job="rails"} |= "api_performance" | json | unwrap duration_ms [5m])) by (endpoint, le)
)
```

### DataDog Query
```
# Webhook security events
service:rails @event:webhook_provider_rejected

# API performance by endpoint
service:rails @event:api_performance 
  | group by @endpoint 
  | p95(@duration_ms)
```

## Alertas Sugeridos

### 1. Webhook Abuse Detection
**Condição:** > 10 rejections from same IP in 5 minutes
**Ação:** Block IP at firewall level

### 2. API Performance Degradation
**Condição:** P95 > 2x baseline for endpoint over 15min
**Ação:** Alert DevOps team

### 3. Error Rate Spike
**Condição:** > 5% error rate on dashboard endpoints
**Ação:** Alert on-call engineer

## Extração Manual Atual

**Arquivo de logs:** `/var/log/rails/production.log` (ou stdout em container)

**Comando de extração rápida:**
```bash
# Últimas 1000 linhas de performance
tail -1000 production.log | grep '"event":"api_performance"' | jq -s 'group_by(.endpoint) | map({endpoint: .[0].endpoint, count: length, avg_duration: (map(.duration_ms) | add / length)})'

# Webhooks rejeitados últimas 24h
grep "$(date -d '24 hours ago' '+%Y-%m-%d')" production.log | grep '"event":"webhook_provider_rejected"' | jq -s 'group_by(.provider) | map({provider: .[0].provider, count: length})'
```

---

**Próximo passo P1:** Integrar com APM (New Relic/DataDog) ou Prometheus + Grafana para painéis visuais automáticos.