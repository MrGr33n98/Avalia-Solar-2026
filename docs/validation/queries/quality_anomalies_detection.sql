-- Quality Check: Anomaly Detection (Spikes and Drops)
-- Detects unusual event volumes using statistical methods
-- Threshold: > 50% deviation from 7-day baseline
-- Run: Hourly
-- Alert: Slack #analytics-alerts if critical

-- Calculate baseline statistics (7-day average excluding today)
WITH daily_baseline AS (
  SELECT
    event_type,
    DATE(created_at) AS event_date,
    COUNT(*) AS daily_count
  FROM analytics_events
  WHERE created_at >= NOW() - INTERVAL '7 days'
    AND created_at < DATE_TRUNC('day', NOW())
  GROUP BY event_type, DATE(created_at)
),
baseline_stats AS (
  SELECT
    event_type,
    AVG(daily_count) AS mean_count,
    STDDEV(daily_count) AS stddev_count,
    COUNT(*) AS sample_days
  FROM daily_baseline
  GROUP BY event_type
  HAVING COUNT(*) >= 3  -- Need at least 3 days of data
),
-- Current 24h counts
current_counts AS (
  SELECT
    event_type,
    COUNT(*) AS count_24h
  FROM analytics_events
  WHERE created_at >= NOW() - INTERVAL '24 hours'
  GROUP BY event_type
),
-- Compare current to baseline
anomalies AS (
  SELECT
    c.event_type,
    c.count_24h AS current_count,
    ROUND(b.mean_count, 1) AS baseline_mean,
    ROUND(b.stddev_count, 1) AS baseline_stddev,
    b.sample_days,
    ROUND(
      ((c.count_24h - b.mean_count) / NULLIF(b.mean_count, 0) * 100),
      1
    ) AS percentage_change,
    CASE
      WHEN c.count_24h > b.mean_count + (2 * b.stddev_count) THEN 'SPIKE'
      WHEN c.count_24h < b.mean_count - (2 * b.stddev_count) THEN 'DROP'
      ELSE 'NORMAL'
    END AS anomaly_type
  FROM current_counts c
  JOIN baseline_stats b ON c.event_type = b.event_type
)
SELECT
  event_type,
  current_count,
  baseline_mean,
  baseline_stddev,
  sample_days,
  percentage_change,
  anomaly_type,
  CASE
    WHEN ABS(percentage_change) >= 100 THEN '🔴 CRITICAL'
    WHEN ABS(percentage_change) >= 50 THEN '🟡 WARNING'
    ELSE '✅ INFO'
  END AS severity,
  NOW() AS detected_at
FROM anomalies
WHERE anomaly_type != 'NORMAL'
ORDER BY ABS(percentage_change) DESC;

-- Summary of current health
SELECT
  COUNT(*) FILTER (WHERE anomaly_type = 'SPIKE') AS spikes_detected,
  COUNT(*) FILTER (WHERE anomaly_type = 'DROP') AS drops_detected,
  COUNT(*) FILTER (WHERE ABS(percentage_change) >= 100) AS critical_anomalies,
  COUNT(*) FILTER (WHERE ABS(percentage_change) >= 50 AND ABS(percentage_change) < 100) AS warning_anomalies,
  CASE
    WHEN COUNT(*) FILTER (WHERE ABS(percentage_change) >= 100) > 0 THEN '🔴 CRITICAL - IMMEDIATE INVESTIGATION'
    WHEN COUNT(*) FILTER (WHERE ABS(percentage_change) >= 50) > 0 THEN '🟡 WARNING - MONITOR CLOSELY'
    ELSE '✅ HEALTHY - NO ANOMALIES'
  END AS overall_health
FROM anomalies
WHERE anomaly_type != 'NORMAL';
