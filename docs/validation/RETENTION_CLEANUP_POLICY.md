# 🗑️ POLÍTICA DE RETENÇÃO E CLEANUP

**Projeto:** Avalia Solar  
**Data:** 2026-03-05  
**Owner:** Data Engineer  
**Status:** ❌ **NÃO IMPLEMENTADO**

---

## SUMÁRIO EXECUTIVO

**Problema:** Tabelas `analytics_events` e `analytics_event_dedup` crescendo sem limite.

**Solução:** Política de retenção com cleanup automatizado.

---

## 1. POLÍTICA DE RETENÇÃO

### 1.1 analytics_events

| Tipo de Evento | Retenção Raw | Retenção Agregado | Justificativa |
|----------------|--------------|-------------------|---------------|
| `lead_submitted` | 2 anos | Indefinido | Compliance, ROI analysis |
| `profile_view` | 180 dias | 2 anos | Analytics, retargeting |
| `page_view` | 90 dias | 2 anos | Performance, menos crítico |
| `search` | 180 dias | 2 anos | UX optimization |
| `web_vital` | 30 dias | 1 ano | Performance monitoring |
| `click_*` | 180 dias | 2 anos | Behavior analysis |
| Outros | 180 dias | 2 anos | Default |

---

### 1.2 analytics_event_dedup

**Retenção:** 30 dias

**Justificativa:** Apenas para dedupe recente, não tem valor histórico.

---

### 1.3 consent_logs

**Retenção:** 5 anos (LGPD compliance)

**Justificativa:** Prova de consentimento para auditoria.

---

## 2. JOB DE CLEANUP

### 2.1 SQL Function

```sql
-- db/migrations/add_cleanup_function.sql
CREATE OR REPLACE FUNCTION cleanup_analytics_events()
RETURNS TABLE(
  deleted_events BIGINT,
  deleted_dedupe BIGINT,
  duration_seconds NUMERIC
) AS $$
DECLARE
  start_time TIMESTAMP;
  end_time TIMESTAMP;
  v_deleted_events BIGINT;
  v_deleted_dedupe BIGINT;
BEGIN
  start_time := clock_timestamp();
  
  -- 1. Deletar eventos antigos (exceto leads)
  DELETE FROM analytics_events
  WHERE tracked_at < CURRENT_DATE - INTERVAL '180 days'
    AND event_type NOT IN ('lead_submitted', 'lead_verified', 'purchase');
  
  GET DIAGNOSTICS v_deleted_events = ROW_COUNT;
  
  -- 2. Deletar leads muito antigos
  DELETE FROM analytics_events
  WHERE tracked_at < CURRENT_DATE - INTERVAL '2 years'
    AND event_type IN ('lead_submitted', 'lead_verified', 'purchase');
  
  GET DIAGNOSTICS v_deleted_events = v_deleted_events + ROW_COUNT;
  
  -- 3. Deletar dedupe antigos
  DELETE FROM analytics_event_dedup
  WHERE inserted_at < CURRENT_DATE - INTERVAL '30 days';
  
  GET DIAGNOSTICS v_deleted_dedupe = ROW_COUNT;
  
  -- 4. Vacuum para liberar espaço
  VACUUM ANALYZE analytics_events;
  VACUUM ANALYZE analytics_event_dedup;
  
  end_time := clock_timestamp();
  
  RETURN QUERY SELECT 
    v_deleted_events,
    v_deleted_dedupe,
    EXTRACT(EPOCH FROM (end_time - start_time))::NUMERIC;
END;
$$ LANGUAGE plpgsql;
```

---

### 2.2 Rake Task

```ruby
# lib/tasks/analytics_cleanup.rake
namespace :analytics do
  desc "Cleanup old analytics events and dedupe table"
  task cleanup: :environment do
    puts "[Analytics Cleanup] Starting..."
    
    result = ActiveRecord::Base.connection.execute(
      "SELECT * FROM cleanup_analytics_events()"
    ).first
    
    deleted_events = result['deleted_events'].to_i
    deleted_dedupe = result['deleted_dedupe'].to_i
    duration = result['duration_seconds'].to_f
    
    puts "[Analytics Cleanup] Completed in #{duration.round(2)}s"
    puts "  - Deleted events: #{deleted_events}"
    puts "  - Deleted dedupe: #{deleted_dedupe}"
    
    # Alert if abnormal
    if deleted_events > 1_000_000
      Analytics::CleanupAlertService.notify(
        deleted_events: deleted_events,
        deleted_dedupe: deleted_dedupe,
        duration: duration
      )
    end
    
    # Log to database
    CleanupLog.create!(
      table_name: 'analytics_events',
      deleted_rows: deleted_events,
      duration_seconds: duration,
      executed_at: Time.current
    )
  end
  
  desc "Dry-run cleanup (show what would be deleted)"
  task cleanup_dry_run: :environment do
    puts "[Analytics Cleanup] DRY RUN"
    
    # Count what would be deleted
    old_events = AnalyticsEvent.where(
      'tracked_at < ?', 180.days.ago
    ).where.not(
      event_type: ['lead_submitted', 'lead_verified', 'purchase']
    ).count
    
    old_leads = AnalyticsEvent.where(
      'tracked_at < ?', 2.years.ago
    ).where(
      event_type: ['lead_submitted', 'lead_verified', 'purchase']
    ).count
    
    old_dedupe = ActiveRecord::Base.connection.execute(
      "SELECT COUNT(*) FROM analytics_event_dedup WHERE inserted_at < CURRENT_DATE - INTERVAL '30 days'"
    ).first['count'].to_i
    
    puts "  - Events (180+ days): #{old_events}"
    puts "  - Leads (2+ years): #{old_leads}"
    puts "  - Dedupe (30+ days): #{old_dedupe}"
    puts "  - TOTAL: #{old_events + old_leads + old_dedupe}"
  end
end
```

---

### 2.3 Cron Schedule

```ruby
# config/schedule.rb (gem 'whenever')

# Weekly cleanup (Sundays at 3am)
every :sunday, at: '3:00 am' do
  rake "analytics:cleanup"
end

# Monthly dry-run report (1st of month at 9am)
every '0 9 1 * *' do
  rake "analytics:cleanup_dry_run"
end
```

**Crontab result:**
```cron
0 3 * * 0 cd /app && rake analytics:cleanup RAILS_ENV=production
0 9 1 * * cd /app && rake analytics:cleanup_dry_run RAILS_ENV=production
```

---

## 3. MONITORAMENTO

### 3.1 CleanupLog Model

```ruby
# app/models/cleanup_log.rb
class CleanupLog < ApplicationRecord
  validates :table_name, presence: true
  validates :deleted_rows, numericality: { greater_than_or_equal_to: 0 }
  validates :duration_seconds, numericality: { greater_than: 0 }
  
  scope :recent, -> { order(executed_at: :desc).limit(10) }
  scope :for_table, ->(table) { where(table_name: table) }
end

# db/migrate/create_cleanup_logs.rb
class CreateCleanupLogs < ActiveRecord::Migration[7.0]
  def change
    create_table :cleanup_logs do |t|
      t.string :table_name, null: false
      t.bigint :deleted_rows, null: false, default: 0
      t.decimal :duration_seconds, precision: 10, scale: 2
      t.datetime :executed_at, null: false
      t.timestamps
    end
    
    add_index :cleanup_logs, :table_name
    add_index :cleanup_logs, :executed_at
  end
end
```

---

### 3.2 Dashboard Query

```sql
-- Metabase: Cleanup History
SELECT
  DATE(executed_at) as date,
  table_name,
  deleted_rows,
  duration_seconds,
  ROUND(deleted_rows / NULLIF(duration_seconds, 0), 0) as rows_per_second
FROM cleanup_logs
WHERE executed_at >= CURRENT_DATE - INTERVAL '90 days'
ORDER BY executed_at DESC;
```

---

### 3.3 Alert Service

```ruby
# app/services/analytics/cleanup_alert_service.rb
module Analytics
  class CleanupAlertService
    ALERT_THRESHOLD = 1_000_000 # 1M rows
    
    def self.notify(deleted_events:, deleted_dedupe:, duration:)
      if deleted_events > ALERT_THRESHOLD
        send_slack_alert(
          deleted_events: deleted_events,
          deleted_dedupe: deleted_dedupe,
          duration: duration
        )
        
        send_sentry_warning(
          deleted_events: deleted_events,
          deleted_dedupe: deleted_dedupe
        )
      end
    end
    
    private
    
    def self.send_slack_alert(deleted_events:, deleted_dedupe:, duration:)
      message = <<~MSG
        🗑️ *Analytics Cleanup Report*
        
        Deleted *#{number_with_delimiter(deleted_events)}* events
        Deleted *#{number_with_delimiter(deleted_dedupe)}* dedupe entries
        Duration: *#{duration.round(2)}s*
        
        ⚠️ Volume exceeds threshold (#{ALERT_THRESHOLD.to_s(:delimited)})
        
        <https://metabase.avaliasolar.com.br/dashboard/cleanup|View Dashboard>
      MSG
      
      SlackNotifier.post(
        channel: '#analytics-alerts',
        text: message,
        username: 'Cleanup Bot'
      )
    end
    
    def self.send_sentry_warning(deleted_events:, deleted_dedupe:)
      Sentry.capture_message(
        "High volume cleanup executed",
        level: :warning,
        extra: {
          deleted_events: deleted_events,
          deleted_dedupe: deleted_dedupe
        }
      )
    end
  end
end
```

---

## 4. PROVAS DE AGENDAMENTO

### 4.1 Verificar Cron Ativo

```bash
# scripts/verify-cleanup-cron.sh
#!/bin/bash

echo "🔍 Verifying cleanup cron jobs..."

# Check if whenever gem installed
if ! gem list | grep -q "whenever"; then
  echo "❌ Gem 'whenever' not installed"
  exit 1
fi

# Check schedule.rb exists
if [ ! -f "config/schedule.rb" ]; then
  echo "❌ config/schedule.rb not found"
  exit 1
fi

# Show current schedule
echo ""
echo "📅 Current schedule:"
bundle exec whenever

# Check crontab (production only)
if [ "$RAILS_ENV" = "production" ]; then
  echo ""
  echo "📋 Crontab entries:"
  crontab -l | grep "analytics:cleanup"
fi

echo ""
echo "✅ Cron verification complete"
```

---

### 4.2 Screenshot de Confirmação

**Evidências necessárias:**

1. `cleanup-cron-config.png` - Screenshot de `config/schedule.rb`
2. `cleanup-crontab-list.png` - Output de `crontab -l`
3. `cleanup-first-run.png` - Log do primeiro run
4. `cleanup-log-dashboard.png` - Dashboard Metabase

---

### 4.3 Test Cleanup Job

```ruby
# spec/tasks/analytics_cleanup_spec.rb
require 'rails_helper'
require 'rake'

RSpec.describe 'analytics:cleanup' do
  before(:all) do
    Rake.application.rake_require 'tasks/analytics_cleanup'
    Rake::Task.define_task(:environment)
  end
  
  before(:each) do
    Rake::Task['analytics:cleanup'].reenable
  end
  
  it 'deletes old events' do
    # Create old event
    old_event = create(:analytics_event, 
      tracked_at: 200.days.ago,
      event_type: 'page_view'
    )
    
    # Create recent event (should not be deleted)
    recent_event = create(:analytics_event,
      tracked_at: 1.day.ago,
      event_type: 'page_view'
    )
    
    expect {
      Rake::Task['analytics:cleanup'].invoke
    }.to change(AnalyticsEvent, :count).by(-1)
    
    expect(AnalyticsEvent.exists?(old_event.id)).to be false
    expect(AnalyticsEvent.exists?(recent_event.id)).to be true
  end
  
  it 'does not delete recent leads' do
    recent_lead = create(:analytics_event,
      tracked_at: 1.year.ago,
      event_type: 'lead_submitted'
    )
    
    expect {
      Rake::Task['analytics:cleanup'].invoke
    }.not_to change(AnalyticsEvent, :count)
    
    expect(AnalyticsEvent.exists?(recent_lead.id)).to be true
  end
  
  it 'creates cleanup log' do
    create(:analytics_event, tracked_at: 200.days.ago)
    
    expect {
      Rake::Task['analytics:cleanup'].invoke
    }.to change(CleanupLog, :count).by(1)
    
    log = CleanupLog.last
    expect(log.deleted_rows).to be > 0
    expect(log.duration_seconds).to be > 0
  end
end
```

---

## 5. MÉTRICAS DE SUCESSO

### 5.1 Storage Growth

**Query:**

```sql
-- Track database size over time
SELECT
  DATE(created_at) as date,
  pg_size_pretty(pg_total_relation_size('analytics_events')) as size,
  COUNT(*) as row_count
FROM analytics_events
GROUP BY DATE(created_at)
ORDER BY date DESC
LIMIT 90;
```

**Target:** Growth < 10% MoM após cleanup

---

### 5.2 Cleanup Efficiency

**Metrics:**

- Rows deleted per run: Target 100k-500k
- Duration: Target < 60s
- Success rate: Target 100%
- Vacuum effectiveness: Space reclaimed > 80%

---

## 6. ROLLBACK PLAN

### 6.1 Se Cleanup Deletar Demais

```sql
-- Restore from backup (se disponível)
pg_restore -d avaliasolar_production backup_before_cleanup.dump

-- Ou restore específico
pg_restore -d avaliasolar_production -t analytics_events backup.dump
```

**Prevenção:** Sempre fazer backup antes do primeiro cleanup

---

### 6.2 Disable Cron

```bash
# Temporariamente desabilitar
crontab -e
# Comentar linha do cleanup

# Ou via Rails
# config/schedule.rb
# Comentar bloco do cleanup

# Update crontab
bundle exec whenever --update-crontab
```

---

## 7. CHECKLIST DE IMPLEMENTAÇÃO

**Preparação:**
- [ ] Criar migration para cleanup_logs table
- [ ] Implementar CleanupLog model
- [ ] Criar SQL function cleanup_analytics_events()
- [ ] Implementar rake task
- [ ] Escrever testes

**Configuração:**
- [ ] Adicionar cleanup job ao schedule.rb
- [ ] Update crontab (whenever --update-crontab)
- [ ] Configurar alertas Slack
- [ ] Criar dashboard Metabase

**Validação:**
- [ ] Executar dry-run
- [ ] Verificar estimativa de rows deletadas
- [ ] Fazer backup do banco
- [ ] Executar primeiro cleanup em staging
- [ ] Monitorar por 24h

**Produção:**
- [ ] Deploy em produção
- [ ] Executar primeiro cleanup manual
- [ ] Verificar logs
- [ ] Confirmar cron ativo (crontab -l)
- [ ] Screenshot de evidência

**Monitoramento Contínuo:**
- [ ] Weekly review de cleanup logs
- [ ] Monthly check de database size
- [ ] Quarterly review de retenção policy

---

## 8. PRÓXIMAS AÇÕES

**Esta semana:**
- [ ] Implementar cleanup function e rake task
- [ ] Setup cron job
- [ ] Testar em staging

**Próxima semana:**
- [ ] Deploy em produção
- [ ] Primeiro cleanup executado
- [ ] Evidências coletadas

**Mensal:**
- [ ] Review de cleanup logs
- [ ] Ajuste de policy se necessário

---

**Status Atual:** ❌ **PLANO APROVADO - AGUARDANDO IMPLEMENTAÇÃO**

**Documento criado:** 2026-03-05  
**Versão:** 1.0  
**Owner:** Data Engineer  
**Aprovado por:** _______________ (Data: _______)
