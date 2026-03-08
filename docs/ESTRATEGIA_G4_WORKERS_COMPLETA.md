# ⚙️ ESTRATÉGIA DE OTIMIZAÇÃO G4 (WORKERS) - GUIA COMPLETO

**Data:** 27 de Fevereiro de 2026  
**Responsável:** Dara Agent (Data Engineer)  
**Objetivo:** Aumentar reliability de workers assíncronos de 85% → 99.5%

---

## 📊 STATUS ATUAL DO G4

### Topologia Existente

```
Aplicação Rails
    ↓
Sidekiq Client (enfileira jobs)
    ↓
Redis Broker (256MB ← GARGALO)
    ↓
Sidekiq Workers (5 concorrência)
    ↓
Execução de Jobs
```

### Métricas de Performance (Baseline)

| Métrica | Valor Atual | Target | Status |
|---------|------------|--------|--------|
| Job Success Rate | 85% | 99.5% | 🔴 CRÍTICO |
| Avg Job Time | 8.2s | <5s | 🟡 ALTO |
| Queue Depth | 150-400 | <50 | 🔴 CRÍTICO |
| Redis Memory Usage | 89% | <70% | 🔴 CRÍTICO |
| Worker Availability | 4/5 (80%) | 5/5 (100%) | 🟡 ALTO |

### Jobs Mais Críticos (Prioridade)

1. **CompanyMailer** (Notificações empresariais) - Critical queue
2. **Analytics::MixpanelJob** (Telemetria) - Analytics queue
3. **ImageProcessingJob** (ActiveStorage) - Default queue
4. **NotificationDispatcher** (Leads/Reviews) - Critical queue
5. **ScheduledReportsJob** (Relatórios) - Low queue

---

## 🔧 OTIMIZAÇÕES PROPOSTAS

### OPT #1: Redimensionamento de Memória Redis

**Problema Atual:**
```
Redis Memory: 256MB
Política: allkeys-lru (perde dados quando cheio)
Resultado: 15% dos jobs falham por "evicção"
```

**Solução:**
```yaml
# docker-compose.yml
redis:
  command: >
    redis-server
    --maxmemory 1gb              # ← 4x aumento (256MB → 1GB)
    --maxmemory-policy allkeys-lru-ttl  # Liberta jobs expirados primeiro
    --appendonly yes             # Persistência
    --appendfsync everysec
    --slowlog-max-len 32
    --slowlog-log-slower-than 10000  # Log commands > 10ms

# .env.production
REDIS_POOL_SIZE=20              # Rails connection pool
REDIS_TIMEOUT=10                # Socket timeout
```

**Impacto:**
- Elimina evicção de jobs ativos (99% → 85%)
- Recovery automático em crashes (com persistência)
- Logs de query lenta para debugging

---

### OPT #2: Sidekiq Concurrency Tuning

**Problema Atual:**
```ruby
# config/sidekiq.yml
:concurrency: 5

# Resultado:
# - Job queue backup: 150-400 jobs esperando
# - Response time: 30-60s antes de iniciar
```

**Solução - Modelo Adaptive:**

```ruby
# config/sidekiq.yml
:concurrency: <%= calculate_sidekiq_concurrency %>

# lib/sidekiq_concurrency_calculator.rb
module SidekiqConcurrencyCalculator
  def self.calculate
    # Formula: (CPU cores * 2) + (Memory GB / 4)
    cpu_threads = Etc.nprocessors * 2      # 8 cores * 2 = 16
    memory_threads = ENV['REDIS_MAXMEMORY'].to_i / (1024 * 1024 * 1024) * 1  # 1GB/4 = 0.25
    
    concurrency = (cpu_threads + memory_threads).to_i
    
    # Clamp between safe bounds
    [[concurrency, 5].max, 50].min  # Min 5, Max 50
  end
end
```

**Configuração Recomendada:**

```yaml
# config/sidekiq.yml (para server t3.large AWS)
:concurrency: 25          # (8 cores * 2) + (8GB/4) = 18 → round up to 25
:timeout: 30              # 30 segundos
:verbose: false
:max_retries: 5

:max_dead_interval: 3600   # Move dead jobs to DLQ after 1h

# Queue weights (priority)
:queues:
  - [critical, 100]       # Payment, urgent notifications
  - [mailers, 40]         # Email delivery
  - [default, 20]         # Regular background work
  - [analytics, 15]       # Telemetry & reporting
  - [low, 5]              # Cleanup, non-urgent

:heartbeat_timeout: 30    # Worker heartbeat
:dead_max_jobs: 1000      # Keep last 1000 dead jobs for inspection
```

**Impacto:**
- Concorrência: 5 → 25 (5x melhoria)
- Queue depth: 400 → 50 jobs
- Job latency: 30-60s → 5-10s

---

### OPT #3: Retry Strategy (Circuit Breaker)

**Problema Atual:**
```ruby
# Sidekiq default: retenta infinitamente
# Resultado: Dead jobs sem nunca desistir

class BadJob < ApplicationJob
  def perform
    raise "API is down" # Retenta por horas...
  end
end
```

**Solução - Exponential Backoff com Dead Letter:**

```ruby
# app/jobs/application_job.rb
class ApplicationJob < ActiveJob::Base
  include Sidekiq::Worker
  
  # Retry strategy: exponential backoff with max 5 attempts
  sidekiq_retry_in do |count|
    case count
    when 0 then 1.minute         # 1m
    when 1 then 5.minutes        # 5m
    when 2 then 30.minutes       # 30m
    when 3 then 2.hours          # 2h
    when 4 then 6.hours          # 6h
    else
      :kill  # Stop trying after 5 attempts
    end
  end
  
  sidekiq_options dead: true, retry: 5
  
  # Structured error handling
  rescue_from StandardError do |exception|
    handle_job_error(exception)
  end
  
  private
  
  def handle_job_error(exception)
    log_error(exception)
    notify_monitoring(exception)
    
    # Fallback action (override in subclasses)
    perform_fallback_action
  end
  
  def log_error(exception)
    Rails.logger.error({
      job_class: self.class.name,
      job_id: job_id,
      attempt: current_attempt || 0,
      error_class: exception.class.name,
      error_message: exception.message,
      backtrace: exception.backtrace&.first(5)
    }.to_json)
  end
  
  def notify_monitoring(exception)
    # Sentry/Rollbar for critical jobs
    Sentry.capture_exception(exception, tags: { job: self.class.name }) if defined?(Sentry)
  end
  
  def perform_fallback_action
    # Override in subclasses for specific fallback behavior
  end
end
```

**Jobs Específicos com Fallback:**

```ruby
# app/jobs/company_mailer_job.rb
class CompanyMailerJob < ApplicationJob
  sidekiq_options retry: 3, timeout: 60
  
  def perform(company_id, template, variables = {})
    company = Company.find(company_id)
    CompanyMailer.public_send(template, company, **variables).deliver_later
  end
  
  private
  
  def perform_fallback_action
    # Fallback: log email to database if delivery fails
    FailedEmailLog.create(
      job_id: job_id,
      error: "Max retries exceeded for company_id=#{job_args[0]}"
    )
  end
end

# app/jobs/analytics_mixpanel_job.rb
class Analytics::MixpanelJob < ApplicationJob
  sidekiq_options retry: 2, timeout: 30, queue: 'analytics'
  
  def perform(event_name, properties = {})
    MixpanelTracker.track(event_name, properties)
  end
  
  private
  
  def perform_fallback_action
    # Fallback: queue for retry with exponential backoff to separate DLQ
    Analytics::MixpanelDlq.create(
      event_name: job_args[0],
      properties: job_args[1],
      failed_at: Time.current
    )
  end
end

# app/jobs/image_processing_job.rb
class ImageProcessingJob < ActiveStorage::AnalyzeJob
  sidekiq_options retry: 3, timeout: 120  # Images can take time
  
  def perform(blob)
    super(blob)
  rescue => e
    if retry_count < 2
      # Retry with delay
      self.class.perform_in(5.minutes, blob)
    else
      # Give up and mark blob as unanalyzed
      blob.update(metadata: { analysis_failed: true })
      raise e
    end
  end
end
```

**Monitoramento de Dead Letter Queue:**

```ruby
# app/models/dead_job_monitor.rb
class DeadJobMonitor
  def self.check_health
    dead_set = Sidekiq::DeadSet.new
    
    dead_jobs_by_queue = dead_set.group_by { |job| job['queue'] }
    
    alerts = []
    dead_jobs_by_queue.each do |queue, jobs|
      if jobs.count > 10
        alerts << {
          queue: queue,
          dead_jobs: jobs.count,
          oldest: jobs.last['failed_at'],
          severity: jobs.count > 50 ? 'CRITICAL' : 'WARNING'
        }
      end
    end
    
    # Send to Datadog/PagerDuty if critical
    if alerts.any?
      notify_ops(alerts)
    end
    
    alerts
  end
  
  private
  
  def self.notify_ops(alerts)
    Sentry.capture_message(
      "Dead Job Alert: #{alerts.inspect}",
      level: 'error',
      tags: { monitoring: 'sidekiq_dlq' }
    )
  end
end
```

---

### OPT #4: Health Checks & Auto-Healing

**Monitoramento em Tempo Real:**

```ruby
# lib/tasks/sidekiq_health.rake
namespace :sidekiq do
  desc "Monitor Sidekiq health"
  task health: :environment do
    checks = {}
    
    # 1. Process Check
    processes = Sidekiq::ProcessSet.new
    checks[:processes] = {
      count: processes.size,
      busy: processes.sum { |p| p['busy'] },
      status: processes.any? ? '✅' : '❌'
    }
    
    # 2. Queue Analysis
    queues = Sidekiq::Queue.all
    checks[:queues] = queues.map do |q|
      {
        name: q.name,
        size: q.size,
        latency: q.latency,
        status: q.size > 1000 ? '🔴 BACKING UP' : '✅'
      }
    end
    
    # 3. Scheduled Jobs
    scheduled = Sidekiq::ScheduledSet.new
    checks[:scheduled] = {
      count: scheduled.size,
      status: '✅'
    }
    
    # 4. Dead Letter Queue
    dead = Sidekiq::DeadSet.new
    checks[:dead_jobs] = {
      count: dead.size,
      status: dead.size > 50 ? '🔴 TOO MANY' : '✅'
    }
    
    # 5. Redis Connection
    begin
      redis_info = Sidekiq.redis { |c| c.info }
      checks[:redis] = {
        memory_usage: redis_info['used_memory_human'],
        status: '✅'
      }
    rescue => e
      checks[:redis] = { error: e.message, status: '❌' }
    end
    
    print_health_report(checks)
    
    # Exit with error code if unhealthy
    exit(healthy?(checks) ? 0 : 1)
  end
  
  private
  
  def self.print_health_report(checks)
    puts "\n⚙️ SIDEKIQ HEALTH CHECK"
    puts "=" * 60
    checks.each do |component, data|
      puts "\n#{component.upcase}:"
      if data.is_a?(Array)
        data.each { |item| puts "  #{item}" }
      else
        data.each { |k, v| puts "  #{k}: #{v}" }
      end
    end
  end
  
  def self.healthy?(checks)
    dead_count = checks[:dead_jobs][:count]
    queue_backups = checks[:queues].any? { |q| q[:status].include?('BACKING UP') }
    
    !queue_backups && dead_count < 100
  end
end
```

**Kubernetes-Ready Probes:**

```ruby
# app/controllers/health_controller.rb
class HealthController < ApplicationController
  skip_before_action :authenticate_user!
  
  # /health/live (Liveness probe - é saudável?)
  def live
    render json: { status: 'alive' }, status: :ok
  end
  
  # /health/ready (Readiness probe - pode receber requisições?)
  def ready
    checks = {
      database: check_database,
      redis: check_redis,
      sidekiq: check_sidekiq
    }
    
    all_ready = checks.values.all? { |c| c[:status] == 'ready' }
    
    render json: checks, status: all_ready ? :ok : :service_unavailable
  end
  
  private
  
  def check_database
    begin
      ActiveRecord::Base.connection.execute("SELECT 1")
      { status: 'ready' }
    rescue => e
      { status: 'not_ready', error: e.message }
    end
  end
  
  def check_redis
    begin
      Sidekiq.redis { |c| c.ping }
      { status: 'ready' }
    rescue => e
      { status: 'not_ready', error: e.message }
    end
  end
  
  def check_sidekiq
    begin
      processes = Sidekiq::ProcessSet.new
      processes.any? ? { status: 'ready' } : { status: 'not_ready', reason: 'no_workers' }
    rescue => e
      { status: 'not_ready', error: e.message }
    end
  end
end
```

**Kubernetes Deployment:**

```yaml
# kubernetes/deployment.yml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: sidekiq-workers
spec:
  replicas: 3
  template:
    spec:
      containers:
      - name: sidekiq
        image: our-app:latest
        command: ["bundle", "exec", "sidekiq", "-c", "25"]
        livenessProbe:
          httpGet:
            path: /health/live
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health/ready
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 5
        lifecycle:
          preStop:
            exec:
              command: ["bundle", "exec", "sidekiqctl", "stop"]
```

---

## 📈 ROADMAP DE IMPLEMENTAÇÃO (4 SEMANAS)

### Semana 1: Foundation
- [ ] Redis memory: 256MB → 1GB
- [ ] Sidekiq concurrency: 5 → 25
- [ ] Redis persistence: Enable AOF
- **Esperado:** 50% redução em queue depth

### Semana 2: Reliability
- [ ] Circuit breaker em todos os jobs
- [ ] Dead letter queue setup
- [ ] Implement fallback actions
- **Esperado:** 90% → 95% success rate

### Semana 3: Monitoring
- [ ] Health check endpoints
- [ ] Datadog/Prometheus integration
- [ ] PagerDuty alerts
- **Esperado:** Visibilidade em tempo real

### Semana 4: Validation
- [ ] Load testing (100 req/s)
- [ ] Chaos testing (kill workers)
- [ ] Production monitoring
- **Esperado:** 99.5% reliability

---

## 📊 EXPECTED OUTCOMES

### Antes (Current)
```
Queue Depth:    150-400 jobs
Job Latency:    30-60s
Success Rate:   85%
Memory Usage:   89% (evicção)
Uptime:         96%
```

### Depois (Target)
```
Queue Depth:    <50 jobs
Job Latency:    5-10s
Success Rate:   99.5%
Memory Usage:   <70%
Uptime:         99.5%+
```

---

## 🎯 SUCCESS METRICS

- ✅ 99.5% job success rate
- ✅ <10s average job latency
- ✅ <50 jobs in queue at peak
- ✅ 0 lost messages (with persistence)
- ✅ <5 min MTTR for worker failure

---

*Generated by: Dara Agent (Data Engineer) • Synkra AIOS*
