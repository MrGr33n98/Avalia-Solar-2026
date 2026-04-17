-- Quality Check: Events Missing Company IDs (when applicable)
-- Threshold: < 10% (acceptable) for company-related events
-- Run: Daily at 2am BRT
-- Alert: Slack #analytics-quality if > 20%

WITH company_events AS (
  SELECT
    event_type,
    COUNT(*) AS total_events,
    COUNT(*) FILTER (WHERE company_id IS NULL) AS missing_company_id,
    ROUND(
      (COUNT(*) FILTER (WHERE company_id IS NULL) * 100.0) / NULLIF(COUNT(*), 0),
      2
    ) AS missing_percentage
  FROM analytics_events
  WHERE created_at >= NOW() - INTERVAL '7 days'
    AND event_type IN (
      'company_profile_view',
      'company_click',
      'lead_submitted',
      'lead_verified',
      'review_submitted'
    )
  GROUP BY event_type
)
SELECT
  event_type,
  total_events,
  missing_company_id,
  missing_percentage,
  CASE
    WHEN missing_percentage >= 30 THEN '🔴 CRITICAL'
    WHEN missing_percentage >= 10 THEN '🟡 WARNING'
    ELSE '✅ OK'
  END AS status
FROM company_events
WHERE missing_percentage > 0
ORDER BY missing_percentage DESC, total_events DESC;

-- Recent 24h Critical Check
SELECT
  COUNT(*) AS events_24h,
  COUNT(*) FILTER (WHERE company_id IS NULL) AS missing_company_id_24h,
  ROUND(
    (COUNT(*) FILTER (WHERE company_id IS NULL) * 100.0) / NULLIF(COUNT(*), 0),
    2
  ) AS missing_percentage_24h,
  CASE
    WHEN (COUNT(*) FILTER (WHERE company_id IS NULL) * 100.0) / NULLIF(COUNT(*), 0) >= 20 THEN '⚠️ IMMEDIATE ACTION REQUIRED'
    WHEN (COUNT(*) FILTER (WHERE company_id IS NULL) * 100.0) / NULLIF(COUNT(*), 0) >= 10 THEN '🟡 MONITOR'
    ELSE '✅ HEALTHY'
  END AS health_status
FROM analytics_events
WHERE created_at >= NOW() - INTERVAL '24 hours'
  AND event_type IN (
    'company_profile_view',
    'company_click',
    'lead_submitted',
    'lead_verified',
    'review_submitted'
  );
