-- Analytics Anomalies Detection View
-- Detects spikes, drops, and anomalies in event volumes using 7-day rolling average
-- 
-- Status levels:
--   SPIKE: > 2 standard deviations above average (outlier high)
--   DROP: > 2 standard deviations below average (outlier low)
--   ANOMALY: > 50% change from average (significant change)
--   NORMAL: Within expected range

CREATE OR REPLACE VIEW analytics_anomalies AS
WITH daily_stats AS (
  SELECT
    DATE(tracked_at) as date,
    event_type,
    COUNT(*) as event_count,
    COUNT(DISTINCT metadata->>'session_id') as unique_sessions,
    COUNT(DISTINCT user_id) FILTER (WHERE user_id IS NOT NULL) as unique_users
  FROM analytics_events
  WHERE tracked_at >= CURRENT_DATE - INTERVAL '30 days'
  GROUP BY DATE(tracked_at), event_type
),
stats_with_rolling AS (
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
  unique_sessions,
  unique_users,
  ROUND(avg_7d::numeric, 2) as avg_7d,
  ROUND(stddev_7d::numeric, 2) as stddev_7d,
  ROUND(((event_count - avg_7d) / NULLIF(avg_7d, 0) * 100)::numeric, 2) as pct_change,
  CASE
    WHEN avg_7d IS NULL OR avg_7d = 0 THEN 'INSUFFICIENT_DATA'
    WHEN event_count > avg_7d + (2 * COALESCE(stddev_7d, 0)) AND COALESCE(stddev_7d, 0) > 0 THEN 'SPIKE'
    WHEN event_count < avg_7d - (2 * COALESCE(stddev_7d, 0)) AND COALESCE(stddev_7d, 0) > 0 THEN 'DROP'
    WHEN ABS(event_count - avg_7d) / NULLIF(avg_7d, 0) > 0.5 THEN 'ANOMALY'
    ELSE 'NORMAL'
  END as status,
  CASE
    WHEN avg_7d IS NULL OR avg_7d = 0 THEN 'Insufficient historical data (< 7 days)'
    WHEN event_count > avg_7d + (2 * COALESCE(stddev_7d, 0)) AND COALESCE(stddev_7d, 0) > 0 THEN 'Volume spike detected (> 2σ)'
    WHEN event_count < avg_7d - (2 * COALESCE(stddev_7d, 0)) AND COALESCE(stddev_7d, 0) > 0 THEN 'Volume drop detected (> 2σ)'
    WHEN ABS(event_count - avg_7d) / NULLIF(avg_7d, 0) > 0.5 THEN 'Significant change detected (> 50%)'
    ELSE 'Volume within expected range'
  END as description
FROM stats_with_rolling
WHERE date >= CURRENT_DATE - INTERVAL '7 days'
  AND avg_7d > 0;
