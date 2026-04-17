-- Quality Check: Events Missing Session IDs
-- Threshold: < 5% (acceptable)
-- Run: Daily at 2am BRT
-- Alert: Slack #analytics-quality if > 5%

WITH event_counts AS (
  SELECT
    event_type,
    COUNT(*) AS total_events,
    COUNT(*) FILTER (WHERE session_id IS NULL OR session_id = '') AS missing_session_id,
    ROUND(
      (COUNT(*) FILTER (WHERE session_id IS NULL OR session_id = '') * 100.0) / NULLIF(COUNT(*), 0),
      2
    ) AS missing_percentage
  FROM analytics_events
  WHERE created_at >= NOW() - INTERVAL '7 days'
  GROUP BY event_type
)
SELECT
  event_type,
  total_events,
  missing_session_id,
  missing_percentage,
  CASE
    WHEN missing_percentage >= 20 THEN '🔴 CRITICAL'
    WHEN missing_percentage >= 5 THEN '🟡 WARNING'
    ELSE '✅ OK'
  END AS status
FROM event_counts
WHERE missing_percentage > 0
ORDER BY missing_percentage DESC, total_events DESC;

-- Summary Stats
SELECT
  COUNT(*) AS total_events_7d,
  COUNT(*) FILTER (WHERE session_id IS NULL OR session_id = '') AS total_missing_session_id,
  ROUND(
    (COUNT(*) FILTER (WHERE session_id IS NULL OR session_id = '') * 100.0) / NULLIF(COUNT(*), 0),
    2
  ) AS overall_missing_percentage,
  CASE
    WHEN (COUNT(*) FILTER (WHERE session_id IS NULL OR session_id = '') * 100.0) / NULLIF(COUNT(*), 0) >= 5 THEN '⚠️ ALERT'
    ELSE '✅ HEALTHY'
  END AS health_status
FROM analytics_events
WHERE created_at >= NOW() - INTERVAL '7 days';
