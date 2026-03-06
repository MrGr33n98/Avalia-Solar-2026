-- SQL PACK: Data Quality Dashboard (Avalia Solar 2026)
-- Use estas consultas para auditoria de maturidade de Analytics Nível 4/5.

-- 1. Lag por Pipeline (Status de processamento)
SELECT 
    pipeline_name, 
    last_processed_at, 
    updated_at,
    NOW() - last_processed_at AS lag_duration
FROM analytics_processing_state
ORDER BY lag_duration DESC;

-- 2. Taxa Warn/Critical (Saúde da reconciliação - Últimos 7 dias)
SELECT 
    status, 
    COUNT(*) as total_reconciliations,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as percent_total
FROM analytics_reconciliations
WHERE day >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY status;

-- 3. Paridade Canônico vs Bruto (Amostra de discrepâncias críticas)
SELECT 
    company_id, 
    day, 
    metric_name, 
    canonical_value, 
    observed_value, 
    delta_percent
FROM analytics_reconciliations
WHERE status = 'critical'
ORDER BY delta_percent DESC
LIMIT 20;

-- 4. Cobertura UTM em Leads (Auditoria de atribuição)
SELECT 
    COUNT(*) as total_leads,
    COUNT(utm_source) as with_source,
    COUNT(utm_campaign) as with_campaign,
    ROUND(COUNT(utm_source) * 100.0 / COUNT(*), 2) as attribution_coverage_pct
FROM leads;

-- 5. Taxa de Event Ingest Errors (Contratos de evento)
SELECT 
    event_type, 
    error_reason, 
    COUNT(*) as error_count,
    MIN(occurred_at) as first_seen,
    MAX(occurred_at) as last_seen
FROM event_ingest_errors
GROUP BY event_type, error_reason
ORDER BY error_count DESC;

-- 6. Verificação de Índices em Produção (PostgreSQL)
SELECT
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'leads'
  AND (indexdef LIKE '%utm_source%' OR indexdef LIKE '%utm_campaign%');
