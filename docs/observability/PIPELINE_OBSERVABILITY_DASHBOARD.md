# 📊 OBSERVABILIDADE DE PIPELINE ANALYTICS

**Projeto:** Avalia Solar  
**Data:** 2026-03-05  
**Owner:** Data Engineer + DevOps  
**Status:** ❌ **NÃO IMPLEMENTADO**

---

## SUMÁRIO EXECUTIVO

**Objetivo:** Monitorar saúde do pipeline de analytics em tempo real.

**Métricas-chave:**
- Eventos/dia
- Taxa de erro 4xx/5xx
- Latência P95
- Fila/drops

---

## 1. DASHBOARD METABASE

### 1.1 Cards Essenciais

**Card 1: Eventos por Dia**

```sql
SELECT
  DATE(tracked_at) as date,
  COUNT(*) as events,
  COUNT(DISTINCT metadata->>'session_id') as sessions
FROM analytics_events
WHERE tracked_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(tracked_at)
ORDER BY date DESC;
```

**Visualização:** Line chart

---

**Card 2: Taxa de Erro (Backend)**

```sql
-- Requer tabela de logs (criar se não existir)
SELECT
  DATE(created_at) as date,
  COUNT(*) FILTER (WHERE status >= 400 AND status < 500) as errors_4xx,
  COUNT(*) FILTER (WHERE status >= 500) as errors_5xx,
  COUNT(*) as total_requests,
  ROUND(100.0 * COUNT(*) FILTER (WHERE status >= 400) / COUNT(*), 2) as error_rate
FROM request_logs
WHERE path = '/api/v1/analytics/track'
  AND created_at >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

**Alertas:**
- 🔴 Error rate > 5%
- 🟡 Error rate > 2%

---

**Card 3: Latência P95**

```sql
SELECT
  DATE(created_at) as date,
  PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY duration_ms) as p50_ms,
  PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY duration_ms) as p95_ms,
  PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY duration_ms) as p99_ms
FROM request_logs
WHERE path = '/api/v1/analytics/track'
  AND created_at >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

**SLO:** P95 < 500ms

---

**Card 4: Eventos em Fila (Frontend)**

```typescript
// Expor métrica via endpoint
GET /api/v1/analytics/queue-stats

{
  "queued_events": 15,
  "queue_limit": 100,
  "utilization_pct": 15,
  "oldest_event_age_ms": 1234
}
```

---

## 2. INSTRUMENTAÇÃO DO BACKEND

### 2.1 Request Logging

```ruby
# app/controllers/api/v1/analytics_controller.rb
around_action :log_request, only: [:track]

def log_request
  start_time = Time.current
  
  yield
  
  duration_ms = ((Time.current - start_time) * 1000).round(2)
  
  RequestLog.create!(
    path: request.path,
    method: request.method,
    status: response.status,
    duration_ms: duration_ms,
    ip: request.remote_ip,
    user_agent: request.user_agent
  )
rescue StandardError => e
  Rails.logger.error("[RequestLog] Failed: #{e.message}")
end
```

---

### 2.2 Métricas Expostas

```ruby
# app/controllers/api/v1/analytics/metrics_controller.rb
class Api::V1::Analytics::MetricsController < Api::V1::BaseController
  def index
    render json: {
      events_today: events_today,
      error_rate_1h: error_rate_last_hour,
      p95_latency_1h: p95_latency_last_hour,
      queue_depth: 0 # Frontend metric
    }
  end
  
  private
  
  def events_today
    AnalyticsEvent.where('tracked_at >= ?', Date.current).count
  end
  
  def error_rate_last_hour
    logs = RequestLog.where(
      path: '/api/v1/analytics/track',
      created_at: 1.hour.ago..Time.current
    )
    
    total = logs.count
    errors = logs.where('status >= 400').count
    
    total > 0 ? (errors.to_f / total * 100).round(2) : 0
  end
  
  def p95_latency_last_hour
    RequestLog.where(
      path: '/api/v1/analytics/track',
      created_at: 1.hour.ago..Time.current
    ).percentile(:duration_ms, 0.95)
  end
end
```

---

## 3. ALERTAS

### 3.1 Slack Webhook

```ruby
# app/services/analytics/pipeline_monitor.rb
module Analytics
  class PipelineMonitor
    ERROR_RATE_THRESHOLD = 5.0 # %
    LATENCY_THRESHOLD = 500 # ms
    
    def self.check_health
      metrics = calculate_metrics
      
      if metrics[:error_rate] > ERROR_RATE_THRESHOLD
        alert_high_error_rate(metrics)
      end
      
      if metrics[:p95_latency] > LATENCY_THRESHOLD
        alert_high_latency(metrics)
      end
    end
    
    private
    
    def self.alert_high_error_rate(metrics)
      SlackNotifier.post(
        channel: '#analytics-alerts',
        text: <<~MSG
          🚨 *High Error Rate in Analytics Pipeline*
          
          Error Rate: *#{metrics[:error_rate]}%*
          Threshold: #{ERROR_RATE_THRESHOLD}%
          
          Last hour:
          - Total requests: #{metrics[:total_requests]}
          - Errors: #{metrics[:error_count]}
          
          <https://metabase.avaliasolar.com.br/dashboard/pipeline|View Dashboard>
        MSG
      )
    end
    
    def self.alert_high_latency(metrics)
      # Similar...
    end
    
    def self.calculate_metrics
      logs = RequestLog.where(
        path: '/api/v1/analytics/track',
        created_at: 1.hour.ago..Time.current
      )
      
      {
        total_requests: logs.count,
        error_count: logs.where('status >= 400').count,
        error_rate: logs.where('status >= 400').count.to_f / logs.count * 100,
        p95_latency: logs.percentile(:duration_ms, 0.95)
      }
    end
  end
end
```

---

### 3.2 Cron Job

```ruby
# config/schedule.rb
every 1.hour do
  rake "analytics:monitor:health"
end
```

---

## 4. SLOs (Service Level Objectives)

| Métrica | SLO | Medição |
|---------|-----|---------|
| Availability | 99.5% uptime | Última hora |
| Error Rate | < 2% | Última hora |
| Latency P95 | < 500ms | Última hora |
| Data Loss | < 0.1% | Diário |

---

## 5. PRÓXIMAS AÇÕES

- [ ] Criar RequestLog model/migration
- [ ] Implementar logging no controller
- [ ] Criar dashboard Metabase
- [ ] Setup alertas Slack
- [ ] Definir SLOs
- [ ] Documentar runbook

---

**Status:** ❌ **TEMPLATE - AGUARDANDO IMPLEMENTAÇÃO**

**Documento criado:** 2026-03-05  
**Versão:** 1.0
