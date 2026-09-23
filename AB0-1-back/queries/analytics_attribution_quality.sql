-- Diagnóstico somente leitura. Execute em staging/teste, nunca em produção sem aprovação.
SELECT
  event_type,
  COUNT(*) AS total_events,
  ROUND(100.0 * COUNT(*) FILTER (WHERE company_id IS NOT NULL) / NULLIF(COUNT(*), 0), 2) AS pct_company_id,
  ROUND(100.0 * COUNT(*) FILTER (WHERE metadata ? 'session_id') / NULLIF(COUNT(*), 0), 2) AS pct_session_id,
  ROUND(100.0 * COUNT(*) FILTER (WHERE metadata ? 'utm_source') / NULLIF(COUNT(*), 0), 2) AS pct_utm_source,
  ROUND(100.0 * COUNT(*) FILTER (WHERE metadata ? 'first_touch' OR metadata ? 'attribution') / NULLIF(COUNT(*), 0), 2) AS pct_first_touch,
  ROUND(100.0 * COUNT(*) FILTER (WHERE metadata ? 'referrer_host') / NULLIF(COUNT(*), 0), 2) AS pct_referrer,
  COUNT(*) FILTER (WHERE metadata->>'is_internal' = 'true' OR metadata->>'is_employee' = 'true' OR metadata->>'is_admin' = 'true') AS internal_events
FROM analytics_events
WHERE tracked_at >= NOW() - INTERVAL '30 days'
GROUP BY event_type
ORDER BY event_type;
