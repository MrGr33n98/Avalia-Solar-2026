# 📊 RELATÓRIO DE QUALIDADE DE DADOS - 7 DIAS

**Projeto:** Avalia Solar  
**Período:** [Data início] a [Data fim]  
**Gerado:** 2026-03-05  
**Responsável:** Data Engineer

---

## SUMÁRIO EXECUTIVO

**Status:** ❌ **RELATÓRIO NÃO GERADO - TEMPLATE**

Este documento define queries e thresholds para gerar relatório de qualidade de dados semanalmente.

---

## 1. QUERIES DE QUALIDADE

### 1.1 Eventos sem company_id

```sql
-- Query: events_missing_company_id_7d.sql
WITH events_last_7d AS (
  SELECT
    DATE(tracked_at) as date,
    event_type,
    COUNT(*) as total_events,
    COUNT(CASE WHEN company_id IS NULL THEN 1 END) as missing_company_id,
    ROUND(100.0 * COUNT(CASE WHEN company_id IS NULL THEN 1 END) / COUNT(*), 2) as pct_missing
  FROM analytics_events
  WHERE tracked_at >= CURRENT_DATE - INTERVAL '7 days'
    AND event_type NOT IN ('page_view', 'search', 'web_vital') -- Eventos que não requerem company_id
  GROUP BY DATE(tracked_at), event_type
)
SELECT
  date,
  event_type,
  total_events,
  missing_company_id,
  pct_missing,
  CASE
    WHEN pct_missing > 20 THEN '🔴 CRITICAL'
    WHEN pct_missing > 10 THEN '🟡 WARNING'
    ELSE '✅ OK'
  END as status
FROM events_last_7d
WHERE pct_missing > 0
ORDER BY pct_missing DESC, total_events DESC;
```

**Threshold:**
- 🔴 CRÍTICO: > 20% de eventos sem company_id
- 🟡 WARNING: 10-20%
- ✅ OK: < 10%

---

### 1.2 Eventos sem session_id

```sql
-- Query: events_missing_session_id_7d.sql
SELECT
  DATE(tracked_at) as date,
  event_type,
  COUNT(*) as total_events,
  COUNT(CASE WHEN metadata->>'session_id' IS NULL THEN 1 END) as missing_session_id,
  ROUND(100.0 * COUNT(CASE WHEN metadata->>'session_id' IS NULL THEN 1 END) / COUNT(*), 2) as pct_missing,
  CASE
    WHEN COUNT(CASE WHEN metadata->>'session_id' IS NULL THEN 1 END) * 100.0 / COUNT(*) > 5 THEN '🔴 CRITICAL'
    WHEN COUNT(CASE WHEN metadata->>'session_id' IS NULL THEN 1 END) * 100.0 / COUNT(*) > 2 THEN '🟡 WARNING'
    ELSE '✅ OK'
  END as status
FROM analytics_events
WHERE tracked_at >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY DATE(tracked_at), event_type
HAVING COUNT(CASE WHEN metadata->>'session_id' IS NULL THEN 1 END) > 0
ORDER BY pct_missing DESC;
```

**Threshold:**
- 🔴 CRÍTICO: > 5% sem session_id
- 🟡 WARNING: 2-5%
- ✅ OK: < 2%

---

### 1.3 Outliers (Spikes e Drops)

```sql
-- Query: events_outliers_7d.sql
WITH daily_counts AS (
  SELECT
    DATE(tracked_at) as date,
    event_type,
    COUNT(*) as event_count
  FROM analytics_events
  WHERE tracked_at >= CURRENT_DATE - INTERVAL '14 days'
  GROUP BY DATE(tracked_at), event_type
),
with_stats AS (
  SELECT
    date,
    event_type,
    event_count,
    AVG(event_count) OVER (
      PARTITION BY event_type
      ORDER BY date
      ROWS BETWEEN 7 PRECEDING AND 1 PRECEDING
    ) as avg_7d,
    STDDEV(event_count) OVER (
      PARTITION BY event_type
      ORDER BY date
      ROWS BETWEEN 7 PRECEDING AND 1 PRECEDING
    ) as stddev_7d
  FROM daily_counts
)
SELECT
  date,
  event_type,
  event_count,
  ROUND(avg_7d, 0) as avg_7d,
  ROUND(((event_count - avg_7d) / NULLIF(avg_7d, 0) * 100), 2) as pct_change,
  CASE
    WHEN event_count > avg_7d + (2 * stddev_7d) THEN '📈 SPIKE'
    WHEN event_count < avg_7d - (2 * stddev_7d) THEN '📉 DROP'
    WHEN ABS(event_count - avg_7d) / NULLIF(avg_7d, 0) > 0.5 THEN '⚠️ ANOMALY'
    ELSE '✅ NORMAL'
  END as status
FROM with_stats
WHERE date >= CURRENT_DATE - INTERVAL '7 days'
  AND avg_7d > 0
ORDER BY ABS(pct_change) DESC;
```

**Threshold:**
- 📈 SPIKE: > 2 desvios padrões acima da média
- 📉 DROP: > 2 desvios padrões abaixo da média
- ⚠️ ANOMALY: Mudança > 50% vs média 7 dias

---

### 1.4 Eventos Duplicados

```sql
-- Query: events_duplicates_7d.sql
SELECT
  DATE(tracked_at) as date,
  event_type,
  event_id,
  COUNT(*) as duplicate_count,
  MIN(tracked_at) as first_seen,
  MAX(tracked_at) as last_seen,
  EXTRACT(EPOCH FROM (MAX(tracked_at) - MIN(tracked_at))) as time_diff_seconds
FROM analytics_events
WHERE tracked_at >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY DATE(tracked_at), event_type, event_id
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC, DATE(tracked_at) DESC
LIMIT 100;
```

**Threshold:**
- 🔴 CRÍTICO: > 0.1% de duplicados
- 🟡 WARNING: 0.01-0.1%
- ✅ OK: < 0.01%

---

## 2. SCRIPT DE GERAÇÃO DE RELATÓRIO

### 2.1 Script SQL

```bash
#!/bin/bash
# scripts/generate-data-quality-report.sh

DATE=$(date +%Y-%m-%d)
REPORT_DIR="docs/validation/reports"
mkdir -p $REPORT_DIR

echo "📊 Generating Data Quality Report - $DATE"

# Execute queries
psql $DATABASE_URL <<EOF > ${REPORT_DIR}/quality-report-${DATE}.txt

\echo '============================================'
\echo 'DATA QUALITY REPORT - 7 DAYS'
\echo "Generated: $DATE"
\echo '============================================'
\echo ''

\echo '1. EVENTOS SEM COMPANY_ID'
\echo '-------------------------------------------'

\i docs/validation/queries/events_missing_company_id_7d.sql

\echo ''
\echo '2. EVENTOS SEM SESSION_ID'
\echo '-------------------------------------------'

\i docs/validation/queries/events_missing_session_id_7d.sql

\echo ''
\echo '3. OUTLIERS (SPIKES E DROPS)'
\echo '-------------------------------------------'

\i docs/validation/queries/events_outliers_7d.sql

\echo ''
\echo '4. EVENTOS DUPLICADOS'
\echo '-------------------------------------------'

\i docs/validation/queries/events_duplicates_7d.sql

\echo ''
\echo '============================================'
\echo 'END OF REPORT'
\echo '============================================'

EOF

echo "✅ Report generated: ${REPORT_DIR}/quality-report-${DATE}.txt"

# Convert to CSV for analysis
psql $DATABASE_URL -c "\COPY (SELECT * FROM ...) TO '${REPORT_DIR}/quality-report-${DATE}.csv' CSV HEADER"

echo "✅ CSV generated: ${REPORT_DIR}/quality-report-${DATE}.csv"
```

---

### 2.2 Rake Task (Backend)

```ruby
# lib/tasks/analytics_quality.rake
namespace :analytics do
  namespace :quality do
    desc "Generate 7-day data quality report"
    task report: :environment do
      require 'csv'
      
      date = Date.current
      report_dir = Rails.root.join('docs', 'validation', 'reports')
      FileUtils.mkdir_p(report_dir)
      
      report_file = report_dir.join("quality-report-#{date}.txt")
      
      File.open(report_file, 'w') do |f|
        f.puts "=" * 60
        f.puts "DATA QUALITY REPORT - 7 DAYS"
        f.puts "Generated: #{date}"
        f.puts "=" * 60
        f.puts ""
        
        # 1. Company ID missing
        f.puts "1. EVENTOS SEM COMPANY_ID"
        f.puts "-" * 60
        
        results = ActiveRecord::Base.connection.execute(
          File.read(Rails.root.join('docs', 'validation', 'queries', 'events_missing_company_id_7d.sql'))
        )
        
        results.each do |row|
          f.puts "#{row['date']} | #{row['event_type']} | #{row['pct_missing']}% | #{row['status']}"
        end
        
        # Similar para outras queries...
      end
      
      puts "✅ Report generated: #{report_file}"
      
      # Send alert if critical issues found
      if results.any? { |r| r['status'] == '🔴 CRITICAL' }
        Analytics::QualityAlertService.notify(report_file)
      end
    end
  end
end
```

---

## 3. ALERTAS CONFIGURADOS

### 3.1 Slack Alert Service

```ruby
# app/services/analytics/quality_alert_service.rb
module Analytics
  class QualityAlertService
    CRITICAL_THRESHOLD_COMPANY_ID = 20 # %
    WARNING_THRESHOLD_COMPANY_ID = 10 # %
    CRITICAL_THRESHOLD_SESSION_ID = 5 # %
    
    def self.notify(report_file)
      issues = parse_issues(report_file)
      
      return if issues[:critical].empty? && issues[:warnings].empty?
      
      message = build_message(issues)
      
      SlackNotifier.post(
        channel: '#analytics-quality',
        text: message,
        username: 'Data Quality Bot',
        icon_emoji: ':chart_with_downwards_trend:'
      )
      
      # Also send to Sentry if critical
      if issues[:critical].any?
        Sentry.capture_message(
          "Critical data quality issues detected",
          level: :error,
          extra: { issues: issues }
        )
      end
    end
    
    private
    
    def self.build_message(issues)
      lines = ["🚨 *Data Quality Report* - #{Date.current}\n"]
      
      if issues[:critical].any?
        lines << "\n🔴 *CRITICAL ISSUES:*"
        issues[:critical].each do |issue|
          lines << "• #{issue[:event_type]}: #{issue[:pct]}% #{issue[:field]} missing"
        end
      end
      
      if issues[:warnings].any?
        lines << "\n🟡 *WARNINGS:*"
        issues[:warnings].each do |issue|
          lines << "• #{issue[:event_type]}: #{issue[:pct]}% #{issue[:field]} missing"
        end
      end
      
      lines << "\n<https://metabase.avaliasolar.com.br/dashboard/data-quality|View Dashboard>"
      lines.join("\n")
    end
    
    def self.parse_issues(report_file)
      # Parse report and extract critical/warning issues
      # Implementation details...
    end
  end
end
```

---

### 3.2 Cron Job

```ruby
# config/schedule.rb
every 1.week, at: 'Monday 9:00 am' do
  rake "analytics:quality:report"
end

# Also daily check
every 1.day, at: '9:00 am' do
  rake "analytics:quality:check_daily"
end
```

---

## 4. DASHBOARD METABASE

### 4.1 Cards do Dashboard

**Dashboard:** "Data Quality - Weekly"

**Card 1: Events Missing Company ID**
```sql
SELECT
  event_type,
  SUM(total_events) as total,
  SUM(missing_company_id) as missing,
  ROUND(100.0 * SUM(missing_company_id) / SUM(total_events), 2) as pct_missing
FROM (
  -- Query from 1.1
) sub
GROUP BY event_type
ORDER BY pct_missing DESC;
```

**Visualization:** Bar chart (event_type vs pct_missing)

---

**Card 2: Events Missing Session ID**
```sql
-- Similar to 1.2
```

**Visualization:** Line chart (date vs pct_missing)

---

**Card 3: Outliers Timeline**
```sql
-- Query from 1.3
```

**Visualization:** Scatter plot (date vs pct_change, color by status)

---

**Card 4: Duplicate Events**
```sql
SELECT
  COUNT(*) as total_duplicates,
  COUNT(DISTINCT event_type) as affected_event_types,
  MAX(duplicate_count) as max_duplicates_single_event
FROM (
  -- Query from 1.4
) sub;
```

**Visualization:** Single value cards

---

### 4.2 Filters

- Date range (default: last 7 days)
- Event type (multi-select)
- Status (Critical/Warning/OK)

---

## 5. TEMPLATE DE RELATÓRIO

```markdown
# Data Quality Report - Week [W]

**Period:** [Start Date] to [End Date]  
**Generated:** [Date]

## Executive Summary

**Overall Health:** [✅ GOOD / 🟡 FAIR / 🔴 POOR]

| Metric | Value | Status | Threshold |
|--------|-------|--------|-----------|
| Events with company_id | 98.5% | ✅ | > 90% |
| Events with session_id | 99.2% | ✅ | > 98% |
| Duplicate events | 0.02% | ✅ | < 0.1% |
| Outliers detected | 2 | 🟡 | < 3 |

---

## 1. Missing Company ID

**Events Affected:** [Number] / [Total] ([Percent]%)

### By Event Type

| Event Type | Total | Missing | % | Status |
|------------|-------|---------|---|--------|
| lead_submitted | 1,234 | 45 | 3.6% | ✅ OK |
| company_card_click | 5,678 | 678 | 11.9% | 🟡 WARNING |
| profile_view | 8,901 | 2,000 | 22.5% | 🔴 CRITICAL |

**Actions Required:**
- [x] Investigate profile_view missing company_id
- [ ] Fix CompanyCard component
- [ ] Deploy fix

---

## 2. Missing Session ID

**Events Affected:** [Number] / [Total] ([Percent]%)

### By Date

| Date | Total | Missing | % | Status |
|------|-------|---------|---|--------|
| 2026-03-01 | 10,000 | 50 | 0.5% | ✅ OK |
| 2026-03-02 | 10,500 | 105 | 1.0% | ✅ OK |
| 2026-03-03 | 9,800 | 294 | 3.0% | 🟡 WARNING |

**Root Cause:** Session storage cleared by user action

**Actions Required:**
- [x] Implement fallback session ID generation
- [ ] Deploy fix

---

## 3. Outliers

**Detected:** [Number] anomalies

### Details

| Date | Event Type | Count | Avg (7d) | Change | Status |
|------|------------|-------|----------|--------|--------|
| 2026-03-03 | page_view | 15,000 | 10,000 | +50% | 📈 SPIKE |
| 2026-03-04 | search | 500 | 1,500 | -66% | 📉 DROP |

**Analysis:**
- **Spike in page_view:** Marketing campaign launched
- **Drop in search:** Search bar temporarily broken

**Actions Required:**
- [x] Confirmed spike is legitimate (campaign)
- [x] Fixed search bar bug
- [ ] Monitor next week

---

## 4. Duplicate Events

**Total Duplicates:** [Number] ([Percent]%)

**Max Duplicates (single event):** [Number]

### Top Offenders

| Event ID | Event Type | Duplicates | Time Diff |
|----------|------------|------------|-----------|
| uuid-123 | page_view | 5 | 0.2s |
| uuid-456 | lead_submitted | 3 | 1.5s |

**Root Cause:** User double-clicking submit button

**Actions Required:**
- [x] Implement button disable on submit
- [ ] Deploy fix
- [ ] Backfill dedupe

---

## 5. Recommendations

**Immediate (P0):**
1. Fix profile_view missing company_id
2. Deploy button disable for forms
3. Monitor search bar recovery

**Short-term (P1):**
1. Improve session ID fallback logic
2. Add rate limiting for duplicate prevention
3. Automated weekly reports

**Long-term (P2):**
1. ML-based anomaly detection
2. Real-time quality alerts
3. Self-healing pipelines

---

## 6. Trends

**vs Last Week:**
- Company ID coverage: 96% → 98.5% (+2.5pp) ✅
- Session ID coverage: 99.1% → 99.2% (+0.1pp) ✅
- Duplicate rate: 0.05% → 0.02% (-0.03pp) ✅
- Outliers: 5 → 2 (-60%) ✅

**Overall:** 📈 **IMPROVING**

---

## Appendix

**Full Reports:**
- [quality-report-2026-03-05.csv](./reports/quality-report-2026-03-05.csv)
- [quality-report-2026-03-05.txt](./reports/quality-report-2026-03-05.txt)

**Queries:**
- [events_missing_company_id_7d.sql](./queries/events_missing_company_id_7d.sql)
- [events_missing_session_id_7d.sql](./queries/events_missing_session_id_7d.sql)
- [events_outliers_7d.sql](./queries/events_outliers_7d.sql)
- [events_duplicates_7d.sql](./queries/events_duplicates_7d.sql)

---

**Prepared by:** Data Engineer  
**Reviewed by:** _____________  
**Next Report:** [Date + 7 days]
```

---

## 6. PRÓXIMAS AÇÕES

**Implementar:**
- [ ] Criar diretório docs/validation/queries/
- [ ] Salvar queries SQL
- [ ] Configurar rake task
- [ ] Setup cron job
- [ ] Criar dashboard Metabase
- [ ] Configurar alertas Slack
- [ ] Testar geração de relatório
- [ ] Agendar primeira execução

**Cronograma:**
- Week 1: Implementar queries e script
- Week 2: Dashboard Metabase
- Week 3: Alertas automatizados
- Week 4: Primeira execução e revisão

---

**Status Atual:** ❌ **TEMPLATE - NÃO IMPLEMENTADO**

**Documento criado:** 2026-03-05  
**Versão:** 1.0  
**Aguardando:** Implementação
