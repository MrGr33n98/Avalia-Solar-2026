# 🎯 PLANO DE IMPLEMENTAÇÃO - AUDITORIA FINAL FASE 1

**Projeto:** Avalia Solar  
**Branch:** `feat/auditoria-final-implementacao`  
**Data:** 2026-03-05  
**Owner:** Data Engineer  
**Versão:** 1.0

---

## SUMÁRIO EXECUTIVO

**Status da Auditoria:** ✅ COMPLETA (10 documentos, ~5.500 linhas)  
**Score Atual:** 40.85/100 🔴 CRÍTICO  
**Score Esperado (Fase 1):** 65/100 🟡 ACEITÁVEL

**Documentos Lidos:**
1. ✅ AUDITORIA_FINAL_INDEX.md
2. ✅ AUDITORIA_TRACKING_TAGS_COMPLETA.md (1,447 linhas)
3. ✅ AUDITORIA_GOVERNANCA_SEGURANCA_COMPLETA.md (2,635 linhas)
4. ✅ docs/validation/PRODUCTION_TRACKING_VALIDATION.md
5. ✅ docs/validation/CONSENT_END_TO_END_EVIDENCE.md
6. ✅ docs/validation/PIXELS_DECISION_MATRIX.md
7. ✅ docs/validation/EVENT_CATALOG_MIGRATION.md
8. ✅ docs/validation/DATA_QUALITY_REPORT_7D.md
9. ✅ docs/validation/RETENTION_CLEANUP_POLICY.md
10. ✅ docs/security/SECRETS_SECURITY_ROTATION.md
11. ✅ docs/observability/PIPELINE_OBSERVABILITY_DASHBOARD.md

---

## VALIDAÇÕES REALIZADAS

### ✅ Tokens Expostos (Git History)
```bash
# Verificação realizada
$ git log --all --full-history -S "47aad0881cd4532d4295c4be5254fad8"
# Resultado: SEM COMMITS ENCONTRADOS no histórico atual
```

**Status:** ✅ Token Mixpanel NÃO está no histórico Git (verificado em ambos repos)

**Conclusão:** Arquivo `.env.production` foi provavelmente adicionado ao `.gitignore` antes de commit ou nunca foi versionado. **NÃO REQUER BFG.**

---

### ❌ Gitleaks CI
```bash
# Verificação realizada
$ ls .github/workflows/security-scans.yml
```

**Status:** ✅ Security workflow EXISTE  
**Problema:** ❌ Usa TruffleHog, mas NÃO usa Gitleaks

**Ação:** Adicionar Gitleaks ao workflow existente

---

### ❌ consent_logs Table
```bash
# Verificação realizada
$ grep "consent_log" AB0-1-back/db/schema.rb
```

**Status:** ❌ Tabela `consent_logs` NÃO EXISTE no schema

**Evidência:**
- `leads` table tem `consent_at` e `consent_ip` ✅
- Mas sem audit trail histórico ❌
- Sem prova de revogação ❌

---

### ⚠️ Dashboard/Request Logging
```bash
# Verificação realizada
$ grep -r "RequestLog\|request_log" AB0-1-back/app/models/
```

**Status:** ❌ RequestLog model NÃO EXISTE

**Evidência:**
- `AnalyticsController` existe ✅
- Mas sem logging de requests ❌
- Sem observabilidade de pipeline ❌

---

## PLANO DE ATAQUE - FASE 1 (P0)

### Prioridade: CRÍTICO - 2 semanas
**Objetivo:** Remediar gaps críticos de compliance e segurança

---

## 🔴 P0-1: ROTAÇÃO DE SEGREDOS & CI (24h)

**Owner:** DevOps + Data Engineer  
**Effort:** 6 horas

### Ações Obrigatórias

#### 1.1 Rotação de Token Mixpanel (se ainda ativo)
```bash
# VERIFICAR se token atual ainda está ativo
curl -X GET "https://mixpanel.com/api/2.0/events" \
  -u 47aad0881cd4532d4295c4be5254fad8:

# Se retornar 200 OK → Token ATIVO → Revogar
# Se retornar 401/403 → Token JÁ REVOGADO → Skip

# Gerar novo token:
# 1. Login: https://mixpanel.com/report/[PROJECT_ID]/settings
# 2. Project Settings > Access Security > Reset Token
# 3. Copiar novo token

# Atualizar em Vercel/GitHub Secrets
vercel env add NEXT_PUBLIC_MIXPANEL_TOKEN production
# Input: [NOVO_TOKEN]

# Redeploy
vercel --prod
```

**Status:** ⚠️ CONDICIONAL (verificar se token está ativo)

---

#### 1.2 Adicionar Gitleaks ao CI
```bash
# Arquivo: .github/workflows/security-scans.yml
# Adicionar job ao workflow existente
```

**Implementação:**
```yaml
# Adicionar ao final de .github/workflows/security-scans.yml

  gitleaks:
    name: Gitleaks Secret Scan
    runs-on: ubuntu-latest
    timeout-minutes: 10
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Gitleaks Scan
        uses: gitleaks/gitleaks-action@v2
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

**Validação:**
```bash
# Testar localmente
docker run -v $(pwd):/repo zricethezav/gitleaks:latest detect --source /repo --verbose

# Se passar: commit e push
git add .github/workflows/security-scans.yml
git commit -m "feat(security): add Gitleaks secret scanning to CI"
git push origin feat/auditoria-final-implementacao
```

---

#### 1.3 Pre-commit Hook (Opcional P1)
```bash
# .git/hooks/pre-commit
#!/bin/bash
echo "🔍 Scanning for secrets with Gitleaks..."
gitleaks protect --staged --verbose || exit 1
```

**Status:** 🟢 P1 (não bloqueante para P0)

---

## 🔴 P0-2: CONSENT AUDIT TRAIL (40h)

**Owner:** Data Engineer  
**Effort:** 40 horas (1 semana)

### 2.1 Migration: consent_logs Table

```bash
# Criar migration
cd AB0-1-back
rails generate migration CreateConsentLogs
```

**Implementação:**
```ruby
# db/migrate/YYYYMMDD_create_consent_logs.rb
class CreateConsentLogs < ActiveRecord::Migration[7.0]
  def change
    create_table :consent_logs do |t|
      # Identificação
      t.references :user, foreign_key: true, index: true
      t.string :session_id, null: false, index: true
      
      # Consentimento
      t.string :consent_type, null: false # 'analytics', 'marketing', 'all', 'none'
      t.boolean :consent_given, null: false
      
      # Contexto
      t.string :policy_version, null: false, default: 'v1.0'
      t.string :consent_method, null: false # 'banner', 'settings', 'api', 'default'
      
      # Rastreabilidade
      t.inet :ip_address
      t.text :user_agent
      t.text :page_url
      t.text :referrer
      
      # Metadata
      t.jsonb :metadata, default: {}
      
      # Timestamps
      t.timestamp :consented_at, null: false, default: -> { 'CURRENT_TIMESTAMP' }
      t.timestamp :expires_at
      
      t.timestamps
    end
    
    # Índices de performance
    add_index :consent_logs, [:user_id, :consented_at], order: { consented_at: :desc }
    add_index :consent_logs, [:session_id, :consented_at], order: { consented_at: :desc }
    add_index :consent_logs, :policy_version
    add_index :consent_logs, :expires_at, where: "expires_at IS NOT NULL"
    
    # Check constraint
    add_check_constraint :consent_logs, 
      "consent_type IN ('analytics', 'marketing', 'functional', 'all', 'none')",
      name: 'consent_logs_type_check'
  end
end
```

```bash
# Executar migration
rails db:migrate
```

---

### 2.2 Model: ConsentLog

```ruby
# app/models/consent_log.rb
class ConsentLog < ApplicationRecord
  belongs_to :user, optional: true
  
  # Validations
  validates :session_id, presence: true
  validates :consent_type, presence: true, inclusion: { 
    in: %w[analytics marketing functional all none] 
  }
  validates :consent_given, inclusion: { in: [true, false] }
  validates :consent_method, presence: true, inclusion: { 
    in: %w[banner settings api default] 
  }
  validates :policy_version, presence: true
  validates :consented_at, presence: true
  
  # Scopes
  scope :recent, -> { order(consented_at: :desc) }
  scope :for_user, ->(user_id) { where(user_id: user_id) }
  scope :for_session, ->(session_id) { where(session_id: session_id) }
  scope :policy_version, ->(version) { where(policy_version: version) }
  scope :expired, -> { where('expires_at < ?', Time.current) }
  
  # Current consent status
  def self.current_consent(user_id: nil, session_id: nil)
    scope = recent
    scope = scope.for_user(user_id) if user_id
    scope = scope.for_session(session_id) if session_id
    scope.first
  end
  
  # Audit trail export
  def self.export_for_audit(user_id: nil, session_id: nil)
    scope = recent
    scope = scope.for_user(user_id) if user_id
    scope = scope.for_session(session_id) if session_id
    scope.select(:consent_type, :consent_given, :consented_at, :consent_method, :policy_version)
  end
end
```

---

### 2.3 Controller: ConsentController

```ruby
# app/controllers/api/v1/consent_controller.rb
class Api::V1::ConsentController < Api::V1::BaseController
  skip_before_action :authenticate_api_user, only: [:log, :status]
  
  # POST /api/v1/consent/log
  def log
    consent_log = ConsentLog.create!(
      user_id: current_user&.id,
      session_id: session_id,
      consent_type: params[:consent_type],
      consent_given: params[:consent_given],
      policy_version: params[:policy_version] || 'v1.0',
      consent_method: params[:consent_method] || 'banner',
      ip_address: request.remote_ip,
      user_agent: request.user_agent,
      page_url: params[:page_url],
      referrer: params[:referrer],
      metadata: params[:metadata] || {}
    )
    
    render json: { status: 'success', id: consent_log.id }, status: :created
  rescue ActiveRecord::RecordInvalid => e
    render json: { status: 'error', message: e.message }, status: :unprocessable_entity
  rescue StandardError => e
    Rails.logger.error("[Consent] Failed to log: #{e.message}")
    render json: { status: 'error' }, status: :internal_server_error
  end
  
  # POST /api/v1/consent/revoke
  def revoke
    ConsentLog.create!(
      user_id: current_user&.id,
      session_id: session_id,
      consent_type: 'all',
      consent_given: false,
      policy_version: 'v1.0',
      consent_method: 'settings_page',
      ip_address: request.remote_ip,
      user_agent: request.user_agent,
      metadata: { revoke_reason: params[:revoke_reason] }
    )
    
    # Marcar analytics_events para anonimização (se necessário)
    if current_user
      AnalyticsEvent.where(user_id: current_user.id).update_all(
        metadata: Arel.sql("metadata || '{\"anonymized\": true}'::jsonb")
      )
    end
    
    render json: { status: 'revoked' }
  end
  
  # GET /api/v1/consent/status
  def status
    consent = ConsentLog.current_consent(
      user_id: current_user&.id,
      session_id: session_id
    )
    
    if consent
      render json: {
        consent_type: consent.consent_type,
        consent_given: consent.consent_given,
        consented_at: consent.consented_at,
        policy_version: consent.policy_version
      }
    else
      render json: { status: 'no_consent' }, status: :not_found
    end
  end
  
  private
  
  def session_id
    cookies.signed[:as_sid] || begin
      new_sid = SecureRandom.uuid
      cookies.signed[:as_sid] = { value: new_sid, expires: 1.year }
      new_sid
    end
  end
end
```

**Routes:**
```ruby
# config/routes.rb
namespace :api do
  namespace :v1 do
    namespace :consent do
      post 'log'
      post 'revoke'
      get 'status'
    end
  end
end
```

---

### 2.4 Frontend Integration

```typescript
// AB0-1-front/lib/analytics/consent.ts
export async function setConsentWithAudit(consent: Partial<ConsentState>): Promise<void> {
  const updated: ConsentState = {
    ...getConsent(),
    ...consent,
    lastUpdated: Date.now()
  };
  
  // Salvar localmente
  localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(updated));
  
  // Enviar para backend (audit trail)
  try {
    await fetch('/api/v1/consent/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        consent_type: updated.analytics && updated.marketing ? 'all' : 
                      updated.analytics ? 'analytics' : 
                      updated.marketing ? 'marketing' : 'none',
        consent_given: updated.analytics || updated.marketing,
        policy_version: 'v1.0',
        consent_method: 'banner',
        page_url: window.location.href,
        referrer: document.referrer
      })
    });
  } catch (e) {
    console.error('[Consent] Failed to log audit trail:', e);
    // Não bloqueia a UX
  }
  
  // Update GTM consent
  updateGoogleConsentMode(updated);
  
  // Emit event
  window.dispatchEvent(new CustomEvent('consent-changed', { detail: updated }));
}
```

**Atualizar componente:**
```typescript
// AB0-1-front/components/CookieConsent.tsx
// Substituir setConsent() por setConsentWithAudit()
```

---

## 🔴 P0-3: DECISÃO DE PIXELS (1 semana)

**Owner:** Head of Marketing + Data Engineer  
**Effort:** Coordenação + 4 horas (implementação se aprovado)

### 3.1 Decisões Requeridas

#### Meta Pixel
- [ ] **IMPLEMENTAR** - Prazo: _____ / Owner: _____
- [ ] **EXCEÇÃO DE RISCO** - Justificativa: _____

**Business Case:**
- Investimento atual em Meta Ads: $ _____ /mês
- ROI esperado: +25% conversão (retargeting)
- Custo implementação: ~$1,200 (8h dev)
- Payback: ~3 dias

---

#### LinkedIn Insight Tag
- [ ] **IMPLEMENTAR** - Prazo: _____ / Owner: _____
- [ ] **EXCEÇÃO DE RISCO** - Justificativa: _____

**Business Case:**
- Investimento atual em LinkedIn Ads: $ _____ /mês
- ROI esperado: +30% ROAS (B2B retargeting)
- Custo implementação: ~$800 (4h dev)
- Payback: ~5 dias

---

#### Google Ads Conversion
- [ ] **IMPLEMENTAR** - Prazo: _____ / Owner: _____
- [ ] **EXCEÇÃO DE RISCO** - Justificativa: _____

**Status:** ⚠️ Parcialmente implementado (GTM pode ter tags)
**Ação:** Auditoria manual do container GTM

---

### 3.2 Aprovações Necessárias

**Stakeholders:**
- [ ] CMO (Marketing ROI)
- [ ] CFO (Budget approval)
- [ ] DPO/Legal (LGPD compliance)
- [ ] CTO (Arquitetura)

**Prazo decisão:** _____ (sugestão: 1 semana)

---

## 🔴 P0-4: DATA RETENTION & CLEANUP (16h)

**Owner:** Data Engineer  
**Effort:** 16 horas

### 4.1 Migration: Cleanup Function

```bash
cd AB0-1-back
rails generate migration AddCleanupFunctions
```

**Implementação:**
```ruby
# db/migrate/YYYYMMDD_add_cleanup_functions.rb
class AddCleanupFunctions < ActiveRecord::Migration[7.0]
  def up
    # Função de cleanup
    execute <<-SQL
      CREATE OR REPLACE FUNCTION cleanup_analytics_events()
      RETURNS TABLE(
        deleted_events BIGINT,
        deleted_dedupe BIGINT,
        duration_seconds NUMERIC
      ) AS $$
      DECLARE
        start_time TIMESTAMP;
        end_time TIMESTAMP;
        v_deleted_events BIGINT := 0;
        v_deleted_dedupe BIGINT;
        v_deleted_temp BIGINT;
      BEGIN
        start_time := clock_timestamp();
        
        -- 1. Deletar eventos antigos (exceto leads)
        DELETE FROM analytics_events
        WHERE tracked_at < CURRENT_DATE - INTERVAL '180 days'
          AND event_type NOT IN ('lead_submitted', 'lead_verified', 'purchase');
        
        GET DIAGNOSTICS v_deleted_temp = ROW_COUNT;
        v_deleted_events := v_deleted_events + v_deleted_temp;
        
        -- 2. Deletar leads muito antigos
        DELETE FROM analytics_events
        WHERE tracked_at < CURRENT_DATE - INTERVAL '2 years'
          AND event_type IN ('lead_submitted', 'lead_verified', 'purchase');
        
        GET DIAGNOSTICS v_deleted_temp = ROW_COUNT;
        v_deleted_events := v_deleted_events + v_deleted_temp;
        
        -- 3. Deletar dedupe antigos
        DELETE FROM analytics_event_dedup
        WHERE inserted_at < CURRENT_DATE - INTERVAL '30 days';
        
        GET DIAGNOSTICS v_deleted_dedupe = ROW_COUNT;
        
        -- 4. Vacuum para liberar espaço
        PERFORM pg_catalog.pg_advisory_lock(1);
        VACUUM ANALYZE analytics_events;
        VACUUM ANALYZE analytics_event_dedup;
        PERFORM pg_catalog.pg_advisory_unlock(1);
        
        end_time := clock_timestamp();
        
        RETURN QUERY SELECT 
          v_deleted_events,
          v_deleted_dedupe,
          EXTRACT(EPOCH FROM (end_time - start_time))::NUMERIC;
      END;
      $$ LANGUAGE plpgsql;
    SQL
  end
  
  def down
    execute "DROP FUNCTION IF EXISTS cleanup_analytics_events();"
  end
end
```

```bash
rails db:migrate
```

---

### 4.2 Rake Task

```ruby
# lib/tasks/analytics.rake
namespace :analytics do
  desc "Cleanup old analytics events"
  task cleanup: :environment do
    puts "[Analytics] Starting cleanup..."
    
    result = ActiveRecord::Base.connection.execute(
      "SELECT * FROM cleanup_analytics_events()"
    ).first
    
    deleted_events = result['deleted_events']
    deleted_dedupe = result['deleted_dedupe']
    duration = result['duration_seconds'].to_f
    
    puts "[Analytics] Cleanup completed:"
    puts "  - Events deleted: #{deleted_events}"
    puts "  - Dedupe deleted: #{deleted_dedupe}"
    puts "  - Duration: #{duration.round(2)}s"
    
    # Alert if > 100k deleted
    if deleted_events > 100_000
      # TODO: Enviar alerta Slack/Email
      puts "  ⚠️  Large cleanup detected (#{deleted_events} events)"
    end
  end
  
  desc "Dry-run cleanup (preview only)"
  task :cleanup_preview, [:days] => :environment do |_t, args|
    days = args[:days]&.to_i || 180
    
    preview = AnalyticsEvent
      .where('tracked_at < ?', days.days.ago)
      .where.not(event_type: ['lead_submitted', 'lead_verified', 'purchase'])
      .group(:event_type)
      .count
    
    puts "[Analytics] Preview of cleanup (#{days} days):"
    preview.each do |event_type, count|
      puts "  - #{event_type}: #{count} events"
    end
    puts "  TOTAL: #{preview.values.sum} events"
  end
end
```

---

### 4.3 Cron Job

```ruby
# Gemfile
gem 'whenever', require: false

# config/schedule.rb
set :output, 'log/cron.log'
set :environment, 'production'

# Cleanup semanal aos domingos 3am
every :sunday, at: '3:00 am' do
  rake 'analytics:cleanup'
end

# Preview diário
every 1.day, at: '2:00 am' do
  rake 'analytics:cleanup_preview[180]'
end
```

**Setup:**
```bash
# Atualizar crontab
whenever --update-crontab

# Verificar
crontab -l
```

---

## 🟡 P1: QUALIDADE DE DADOS & MONITORAMENTO (1 semana)

**Owner:** Data Engineer  
**Effort:** 24 horas

### 5.1 Monitor de Anomalias

```sql
-- db/views/analytics_anomalies_v01.sql
CREATE OR REPLACE VIEW analytics_anomalies AS
WITH daily_stats AS (
  SELECT
    DATE(tracked_at) as date,
    event_type,
    COUNT(*) as event_count,
    COUNT(DISTINCT metadata->>'session_id') as unique_sessions
  FROM analytics_events
  WHERE tracked_at >= CURRENT_DATE - INTERVAL '30 days'
  GROUP BY DATE(tracked_at), event_type
),
stats_with_avg AS (
  SELECT
    *,
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
  FROM daily_stats
)
SELECT
  date,
  event_type,
  event_count,
  avg_7d,
  ROUND(((event_count - avg_7d) / NULLIF(avg_7d, 0) * 100)::numeric, 2) as pct_change,
  CASE
    WHEN event_count > avg_7d + (2 * stddev_7d) THEN 'SPIKE'
    WHEN event_count < avg_7d - (2 * stddev_7d) THEN 'DROP'
    WHEN ABS(event_count - avg_7d) / NULLIF(avg_7d, 0) > 0.5 THEN 'ANOMALY'
    ELSE 'NORMAL'
  END as status
FROM stats_with_avg
WHERE date = CURRENT_DATE - INTERVAL '1 day'
  AND avg_7d > 0
ORDER BY ABS(pct_change) DESC;
```

**Migration:**
```bash
rails generate migration CreateAnalyticsAnomaliesView
```

```ruby
# db/migrate/YYYYMMDD_create_analytics_anomalies_view.rb
class CreateAnalyticsAnomaliesView < ActiveRecord::Migration[7.0]
  def up
    sql = File.read(Rails.root.join('db', 'views', 'analytics_anomalies_v01.sql'))
    execute sql
  end
  
  def down
    execute "DROP VIEW IF EXISTS analytics_anomalies;"
  end
end
```

---

### 5.2 Alertas Slack (Opcional)

```ruby
# app/services/analytics/anomaly_detector.rb
module Analytics
  class AnomalyDetector
    THRESHOLD_PCT = 50
    
    def self.check_and_alert
      anomalies = ActiveRecord::Base.connection.execute(
        "SELECT * FROM analytics_anomalies WHERE status IN ('SPIKE', 'DROP', 'ANOMALY')"
      )
      
      return if anomalies.empty?
      
      message = build_alert_message(anomalies)
      
      # Log para Rails
      Rails.logger.warn("[Analytics] Anomalies detected: #{anomalies.count}")
      
      # TODO: Integrar Slack notifier se disponível
      # SlackNotifier.post(channel: '#analytics-alerts', text: message)
    end
    
    def self.build_alert_message(anomalies)
      lines = ["🚨 Analytics Anomalies Detected\n"]
      
      anomalies.each do |row|
        emoji = row['status'] == 'SPIKE' ? '📈' : '📉'
        lines << "#{emoji} #{row['event_type']}: #{row['pct_change']}% (#{row['event_count']} vs #{row['avg_7d'].to_i} avg)"
      end
      
      lines.join("\n")
    end
  end
end
```

**Rake task:**
```ruby
# lib/tasks/analytics.rake
namespace :analytics do
  desc "Check for anomalies and alert"
  task check_anomalies: :environment do
    Analytics::AnomalyDetector.check_and_alert
    puts "[Analytics] Anomaly check completed"
  end
end
```

---

## 🟢 P2: OBSERVABILIDADE DE PIPELINE (2 semanas)

**Owner:** Data Engineer  
**Status:** Planejado mas não bloqueante para P0

**Referência:** docs/observability/PIPELINE_OBSERVABILITY_DASHBOARD.md

---

## RISCOS E DEPENDÊNCIAS

### Riscos Identificados

| Risco | Probabilidade | Impacto | Mitigação |
|-------|---------------|---------|-----------|
| Token Mixpanel já revogado | ALTA | BAIXO | Verificar status antes de rotar |
| Migration de consent_logs falhar | BAIXA | MÉDIO | Testar em staging primeiro |
| Cleanup deletar dados importantes | BAIXA | ALTO | Implementar backup antes do primeiro run |
| Decisão de pixels atrasada | MÉDIA | MÉDIO | Deadline de 1 semana |
| Frontend deploy quebrar consent | BAIXA | ALTO | Testes Cypress (P1) |

---

### Dependências Externas

1. **Vercel/GitHub Secrets** - Para rotação de tokens
2. **Stakeholders** - Para decisão de pixels
3. **Staging Environment** - Para testar migrations (recomendado)

---

## COMANDOS PARA EXECUTAR (P0)

### ⚠️ NÃO EXECUTAR AINDA - APENAS PLANO

```bash
# 1. Verificar token Mixpanel (se ativo)
curl -X GET "https://mixpanel.com/api/2.0/events" \
  -u 47aad0881cd4532d4295c4be5254fad8: | jq

# 2. Adicionar Gitleaks ao CI
# Editar: .github/workflows/security-scans.yml
git add .github/workflows/security-scans.yml
git commit -m "feat(security): add Gitleaks secret scanning"
git push

# 3. Criar consent_logs migration
cd AB0-1-back
rails generate migration CreateConsentLogs
# Editar migration conforme spec acima
rails db:migrate

# 4. Criar ConsentLog model
# Criar app/models/consent_log.rb
# Criar app/controllers/api/v1/consent_controller.rb
# Atualizar routes.rb

# 5. Frontend: Atualizar consent.ts
cd ../AB0-1-front
# Editar lib/analytics/consent.ts
# Atualizar components/CookieConsent.tsx

# 6. Criar cleanup function
cd ../AB0-1-back
rails generate migration AddCleanupFunctions
# Editar migration conforme spec
rails db:migrate

# 7. Criar rake tasks
# Criar lib/tasks/analytics.rake

# 8. Setup cron (production)
bundle add whenever
whenever --update-crontab

# 9. Commit tudo
git add .
git commit -m "feat(analytics): implement audit trail and cleanup policy"
git push
```

---

## DECISÕES PENDENTES

### ⚠️ DECISÕES OBRIGATÓRIAS (1 SEMANA)

#### 1. Meta Pixel
- [ ] IMPLEMENTAR
- [ ] EXCEÇÃO DE RISCO
- **Responsável:** CMO + Head of Marketing
- **Prazo:** _____

#### 2. LinkedIn Insight Tag
- [ ] IMPLEMENTAR
- [ ] EXCEÇÃO DE RISCO
- **Responsável:** CMO + Head of Marketing
- **Prazo:** _____

#### 3. Google Ads Conversion
- [ ] IMPLEMENTAR (verificar se já existe no GTM)
- [ ] EXCEÇÃO DE RISCO
- **Responsável:** CMO + Head of Marketing
- **Prazo:** _____

---

### 🟢 DECISÕES TÉCNICAS (ARQUITETO)

#### 4. Estratégia de Backup antes do Cleanup
- [ ] Backup manual antes do primeiro run
- [ ] Backup automatizado via cron
- [ ] Sem backup (confiar na função SQL)
- **Responsável:** Data Engineer + DevOps
- **Prazo:** Antes de executar cleanup

#### 5. Integração Slack (Alertas)
- [ ] Implementar agora (P0)
- [ ] Adiar para P1
- [ ] Adiar para P2
- **Responsável:** Data Engineer
- **Prazo:** _____

---

## ORDEM DE EXECUÇÃO RECOMENDADA

### Semana 1 (P0 Crítico)

**Dia 1-2:**
1. ✅ Verificar status token Mixpanel
2. ✅ Revogar e gerar novo (se necessário)
3. ✅ Adicionar Gitleaks ao CI
4. ✅ Testar workflow

**Dia 3-4:**
5. ✅ Criar migration consent_logs
6. ✅ Criar ConsentLog model
7. ✅ Criar ConsentController
8. ✅ Atualizar routes
9. ✅ Testar API endpoints

**Dia 5:**
10. ✅ Atualizar frontend consent.ts
11. ✅ Atualizar CookieConsent component
12. ✅ Testar em dev
13. ✅ Deploy em staging

---

### Semana 2 (P0 + P1)

**Dia 6-7:**
14. ✅ Criar cleanup function SQL
15. ✅ Criar migration
16. ✅ Executar migration
17. ✅ Criar rake tasks
18. ✅ Testar cleanup em staging

**Dia 8:**
19. ✅ Setup cron job
20. ✅ Executar primeiro cleanup (staging)
21. ✅ Monitorar por 24h

**Dia 9:**
22. ✅ Criar view analytics_anomalies
23. ✅ Criar AnomalyDetector service
24. ✅ Testar alertas

**Dia 10:**
25. ✅ Code review completo
26. ✅ Merge para develop
27. ✅ Deploy em production
28. ✅ Monitoramento 48h

---

## MÉTRICAS DE SUCESSO

### Semana 1 (P0)
- ✅ Gitleaks CI ativo e passing
- ✅ consent_logs table criada
- ✅ API /api/v1/consent/log funcionando
- ✅ Frontend enviando logs de consent
- ✅ Pelo menos 100 logs de consent capturados

### Semana 2 (P0+P1)
- ✅ Cleanup function executado com sucesso
- ✅ Database size reduzido (verificar pg_size_pretty)
- ✅ Cron job agendado
- ✅ View analytics_anomalies retornando dados
- ✅ Zero eventos críticos detectados

### Após 30 dias
- ✅ 100% de eventos de consent logados
- ✅ Decisão de pixels tomada (implementar ou exceção)
- ✅ Database growth < 10% MoM
- ✅ Zero secrets expostos em novos PRs

---

## APROVAÇÕES NECESSÁRIAS

### Técnicas
- [ ] Data Engineer (Owner): _______________
- [ ] Dev Team Lead: _______________
- [ ] DevOps Lead: _______________

### Negócio
- [ ] Head of Marketing (Pixels): _______________
- [ ] DPO/Legal (Compliance): _______________
- [ ] CTO (Arquitetura): _______________

---

## ANEXOS

### A. Links de Referência

**Auditorias:**
- AUDITORIA_FINAL_INDEX.md
- AUDITORIA_TRACKING_TAGS_COMPLETA.md
- AUDITORIA_GOVERNANCA_SEGURANCA_COMPLETA.md

**Documentação Técnica:**
- docs/validation/PRODUCTION_TRACKING_VALIDATION.md
- docs/validation/CONSENT_END_TO_END_EVIDENCE.md
- docs/validation/RETENTION_CLEANUP_POLICY.md
- docs/security/SECRETS_SECURITY_ROTATION.md

---

### B. Contatos

**Owner Geral:** Data Engineer  
**Escalação:** CTO

**Equipe:**
- Dev Team: Frontend + Backend
- DevOps: Infrastructure + CI/CD
- Marketing: Pixels + Campaigns
- Legal: LGPD/GDPR Compliance

---

### C. Histórico de Mudanças

| Versão | Data | Autor | Mudanças |
|--------|------|-------|----------|
| 1.0 | 2026-03-05 | Data Engineer | Plano inicial |

---

**Status do Plano:** ✅ **COMPLETO - PRONTO PARA REVISÃO**  
**Próxima Ação:** Obter aprovações e iniciar execução  
**Estimativa Total P0:** 56 horas (2 semanas com 1 dev full-time)
