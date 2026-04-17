-- Quality Check: Duplicate Events Detection
-- Threshold: < 0.1% duplicate rate (acceptable)
-- Run: Hourly
-- Alert: Slack #analytics-quality if > 1%

-- Check dedupe table for recent activity
WITH dedupe_stats AS (
  SELECT
    COUNT(*) AS total_duplicates_24h,
    COUNT(DISTINCT fingerprint) AS unique_fingerprints_24h
  FROM deduped_events
  WHERE created_at >= NOW() - INTERVAL '24 hours'
),
event_stats AS (
  SELECT
    COUNT(*) AS total_events_24h
  FROM analytics_events
  WHERE created_at >= NOW() - INTERVAL '24 hours'
),
combined AS (
  SELECT
    d.total_duplicates_24h,
    d.unique_fingerprints_24h,
    e.total_events_24h,
    ROUND(
      (d.total_duplicates_24h * 100.0) / NULLIF(e.total_events_24h + d.total_duplicates_24h, 0),
      3
    ) AS duplicate_rate_percentage
  FROM dedupe_stats d
  CROSS JOIN event_stats e
)
SELECT
  total_events_24h,
  total_duplicates_24h,
  unique_fingerprints_24h,
  duplicate_rate_percentage,
  CASE
    WHEN duplicate_rate_percentage >= 5.0 THEN '🔴 CRITICAL - CHECK DEDUPE LOGIC'
    WHEN duplicate_rate_percentage >= 1.0 THEN '🟡 WARNING - HIGH DUPLICATE RATE'
    WHEN duplicate_rate_percentage >= 0.1 THEN '⚠️ INFO - ACCEPTABLE'
    ELSE '✅ HEALTHY'
  END AS health_status,
  NOW() AS checked_at
FROM combined;

-- Top duplicate fingerprints (debugging)
SELECT
  fingerprint,
  COUNT(*) AS duplicate_count,
  MAX(created_at) AS last_seen,
  MIN(created_at) AS first_seen,
  MAX(created_at) - MIN(created_at) AS duration
FROM deduped_events
WHERE created_at >= NOW() - INTERVAL '24 hours'
GROUP BY fingerprint
ORDER BY duplicate_count DESC
LIMIT 10;

-- Hourly duplicate trends (last 24h)
SELECT
  DATE_TRUNC('hour', created_at) AS hour,
  COUNT(*) AS duplicates_per_hour
FROM deduped_events
WHERE created_at >= NOW() - INTERVAL '24 hours'
GROUP BY DATE_TRUNC('hour', created_at)
ORDER BY hour DESC;
