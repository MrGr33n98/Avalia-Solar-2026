-- ── Metabase SQL Views for AvaliaSolar Growth Dashboards ──────────────
-- Run these in PostgreSQL to create views that Metabase will read.
-- Metabase connects to PostgreSQL with a read-only user.
--
-- Setup:
-- 1. psql -U availsolar_user -d availsolar_db -f db/metabase_views.sql
-- 2. In Metabase: Settings → Databases → Add → PostgreSQL
-- 3. Sync schema → Create dashboards from views

-- ── View 1: Daily Growth Summary ──────────────────────────────────────
CREATE OR REPLACE VIEW v_daily_growth AS
SELECT
  DATE(ae.created_at) as date,
  COUNT(DISTINCT ae.user_session_id) as sessions,
  COUNT(*) as total_events,
  COUNT(*) FILTER (WHERE ae.event_name = 'roi_expand') as roi_expands,
  COUNT(*) FILTER (WHERE ae.event_name = 'wizard_start') as wizard_starts,
  COUNT(*) FILTER (WHERE ae.event_name = 'wizard_complete') as wizard_completions,
  COUNT(*) FILTER (WHERE ae.event_name = 'whatsapp_click') as whatsapp_clicks,
  COUNT(*) FILTER (WHERE ae.event_name = 'lead_created') as leads_created,
  -- Funnel rates
  ROUND(
    COUNT(*) FILTER (WHERE ae.event_name = 'roi_expand')::numeric /
    NULLIF(COUNT(*) FILTER (WHERE ae.event_name = 'wizard_start'), 0) * 100, 1
  ) as roi_expand_rate,
  ROUND(
    COUNT(*) FILTER (WHERE ae.event_name = 'wizard_complete')::numeric /
    NULLIF(COUNT(*) FILTER (WHERE ae.event_name = 'roi_expand'), 0) * 100, 1
  ) as wizard_complete_rate,
  ROUND(
    COUNT(*) FILTER (WHERE ae.event_name = 'lead_created')::numeric /
    NULLIF(COUNT(*) FILTER (WHERE ae.event_name = 'wizard_complete'), 0) * 100, 1
  ) as lead_creation_rate,
  ROUND(
    COUNT(*) FILTER (WHERE ae.event_name = 'lead_created')::numeric /
    NULLIF(COUNT(*) FILTER (WHERE ae.event_name = 'wizard_start'), 0) * 100, 2
  ) as overall_conversion_rate
FROM analytics_events ae
WHERE ae.created_at > NOW() - INTERVAL '90 days'
GROUP BY DATE(ae.created_at)
ORDER BY date DESC;

COMMENT ON VIEW v_daily_growth IS 'Daily growth metrics with funnel rates. Primary dashboard view.';

-- ── View 2: City Performance ──────────────────────────────────────────
CREATE OR REPLACE VIEW v_city_performance AS
SELECT
  ae.city,
  ae.state,
  ae.vertical,
  COUNT(DISTINCT ae.user_session_id) as sessions,
  COUNT(*) FILTER (WHERE ae.event_name = 'wizard_complete') as completions,
  COUNT(*) FILTER (WHERE ae.event_name = 'lead_created') as leads,
  COUNT(*) FILTER (WHERE ae.event_name = 'whatsapp_click') as whatsapp_clicks,
  ROUND(
    COUNT(*) FILTER (WHERE ae.event_name = 'lead_created')::numeric /
    NULLIF(COUNT(DISTINCT ae.user_session_id), 0) * 100, 2
  ) as conversion_rate,
  AVG(i.intent_score) as avg_intent_score,
  COUNT(DISTINCT i.session_id) FILTER (WHERE i.intent_level IN ('boiling', 'immediate', 'declared')) as high_intent_users,
  MAX(i.last_signal_at) as last_activity_at
FROM analytics_events ae
LEFT JOIN intent_signals i ON i.session_id = ae.user_session_id
WHERE ae.created_at > NOW() - INTERVAL '30 days'
  AND ae.city IS NOT NULL
GROUP BY ae.city, ae.state, ae.vertical
ORDER BY leads DESC;

COMMENT ON VIEW v_city_performance IS 'Performance by city with intent scoring. Used for market expansion decisions.';

-- ── View 3: Funnel Analysis ───────────────────────────────────────────
CREATE OR REPLACE VIEW v_funnel_analysis AS
WITH daily_funnel AS (
  SELECT
    DATE(created_at) as date,
    COUNT(*) FILTER (WHERE event_name = 'wizard_start') as step1_starts,
    COUNT(*) FILTER (WHERE event_name = 'roi_expand') as step2_expand,
    COUNT(*) FILTER (WHERE event_name = 'wizard_complete') as step3_complete,
    COUNT(*) FILTER (WHERE event_name = 'lead_created') as step4_lead
  FROM analytics_events
  WHERE event_name IN ('wizard_start', 'roi_expand', 'wizard_complete', 'lead_created')
    AND created_at > NOW() - INTERVAL '90 days'
  GROUP BY DATE(created_at)
)
SELECT
  date,
  step1_starts,
  step2_expand,
  step3_complete,
  step4_lead,
  ROUND(step2_expand::numeric / NULLIF(step1_starts, 0) * 100, 1) as step1_to_2_pct,
  ROUND(step3_complete::numeric / NULLIF(step2_expand, 0) * 100, 1) as step2_to_3_pct,
  ROUND(step4_lead::numeric / NULLIF(step3_complete, 0) * 100, 1) as step3_to_4_pct,
  ROUND(step4_lead::numeric / NULLIF(step1_starts, 0) * 100, 1) as overall_conversion_pct
FROM daily_funnel
ORDER BY date DESC;

COMMENT ON VIEW v_funnel_analysis IS 'Daily funnel conversion rates. Identifies drop-off points.';

-- ── View 4: Channel/Content ROI ───────────────────────────────────────
CREATE OR REPLACE VIEW v_channel_performance AS
SELECT
  ae.utm_source as channel,
  ae.utm_medium,
  ae.utm_campaign,
  COUNT(DISTINCT ae.user_session_id) as sessions,
  COUNT(*) FILTER (WHERE ae.event_name = 'wizard_complete') as completions,
  COUNT(*) FILTER (WHERE ae.event_name = 'lead_created') as leads,
  ROUND(
    COUNT(*) FILTER (WHERE ae.event_name = 'lead_created')::numeric /
    NULLIF(COUNT(DISTINCT ae.user_session_id), 0) * 100, 2
  ) as conversion_rate,
  COUNT(DISTINCT wm.id) FILTER (WHERE wm.direction = 'outbound') as whatsapp_messages_sent,
  COUNT(DISTINCT i.session_id) FILTER (WHERE i.intent_level IN ('boiling', 'immediate', 'declared')) as high_intent_users
FROM analytics_events ae
LEFT JOIN whatsapp_messages wm ON wm.lead_id::text = ae.user_session_id
LEFT JOIN intent_signals i ON i.session_id = ae.user_session_id
WHERE ae.utm_source IS NOT NULL
  AND ae.created_at > NOW() - INTERVAL '30 days'
GROUP BY ae.utm_source, ae.utm_medium, ae.utm_campaign
ORDER BY leads DESC;

COMMENT ON VIEW v_channel_performance IS 'Performance by marketing channel (UTM). Used for budget allocation.';

-- ── View 5: Content ROI ───────────────────────────────────────────────
CREATE OR REPLACE VIEW v_content_roi AS
SELECT
  ae.utm_campaign,
  ae.utm_source,
  ae.utm_medium,
  COUNT(DISTINCT ae.user_session_id) as sessions,
  COUNT(*) FILTER (WHERE ae.event_name = 'wizard_complete') as completions,
  COUNT(*) FILTER (WHERE ae.event_name = 'lead_created') as leads,
  ROUND(
    COUNT(*) FILTER (WHERE ae.event_name = 'lead_created')::numeric /
    NULLIF(COUNT(DISTINCT ae.user_session_id), 0) * 100, 2
  ) as conversion_rate,
  na.title as related_news,
  na.relevance_score as news_relevance,
  na.published_at as news_published_at
FROM analytics_events ae
LEFT JOIN news_articles na ON na.url = ae.referrer
WHERE ae.utm_campaign IS NOT NULL
  AND ae.created_at > NOW() - INTERVAL '30 days'
GROUP BY ae.utm_campaign, ae.utm_source, ae.utm_medium, na.title, na.relevance_score, na.published_at
ORDER BY leads DESC;

COMMENT ON VIEW v_content_roi IS 'Content performance linked to news articles and campaigns.';

-- ── View 6: Intent Distribution ───────────────────────────────────────
CREATE OR REPLACE VIEW v_intent_distribution AS
SELECT
  i.intent_level,
  COUNT(*) as user_count,
  ROUND(AVG(i.intent_score), 1) as avg_score,
  MAX(i.intent_score) as max_score,
  COUNT(*) FILTER (WHERE i.vertical = 'solar') as solar_users,
  COUNT(*) FILTER (WHERE i.vertical = 'ev') as ev_users,
  COUNT(*) FILTER (WHERE i.city IS NOT NULL) as users_with_city,
  MAX(i.last_signal_at) as last_signal_at
FROM intent_signals i
WHERE i.last_signal_at > NOW() - INTERVAL '7 days'
GROUP BY i.intent_level
ORDER BY avg_score DESC;

COMMENT ON VIEW v_intent_distribution IS 'Current intent level distribution. Used for demand planning.';

-- ── View 7: WhatsApp Performance ──────────────────────────────────────
CREATE OR REPLACE VIEW v_whatsapp_performance AS
SELECT
  wm.message_type,
  wm.direction,
  wm.status,
  COUNT(*) as message_count,
  COUNT(*) FILTER (WHERE wm.reply_received_at IS NOT NULL) as replies,
  ROUND(
    COUNT(*) FILTER (WHERE wm.reply_received_at IS NOT NULL)::numeric /
    NULLIF(COUNT(*), 0) * 100, 1
  ) as reply_rate,
  EXTRACT(HOUR FROM AVG(wm.reply_received_at - wm.created_at)) as avg_reply_hours
FROM whatsapp_messages wm
WHERE wm.created_at > NOW() - INTERVAL '30 days'
GROUP BY wm.message_type, wm.direction, wm.status
ORDER BY message_count DESC;

COMMENT ON VIEW v_whatsapp_performance IS 'WhatsApp messaging performance. Used for channel optimization.';

-- ── View 8: News Impact ───────────────────────────────────────────────
CREATE OR REPLACE VIEW v_news_impact AS
SELECT
  na.id as article_id,
  na.title,
  na.url,
  na.source,
  na.category,
  na.vertical,
  na.urgency,
  na.relevance_score,
  na.published_at,
  COUNT(DISTINCT ae.user_session_id) as referred_sessions,
  COUNT(*) FILTER (WHERE ae.event_name = 'wizard_complete') as referred_completions,
  COUNT(*) FILTER (WHERE ae.event_name = 'lead_created') as referred_leads,
  na.used_in_content,
  na.fetched_at
FROM news_articles na
LEFT JOIN analytics_events ae ON ae.referrer = na.url
GROUP BY na.id, na.title, na.url, na.source, na.category, na.vertical, na.urgency, na.relevance_score, na.published_at, na.used_in_content, na.fetched_at
ORDER BY referred_leads DESC;

COMMENT ON VIEW v_news_impact IS 'Impact of news articles on user behavior. Used for content strategy.';

-- ── View 9: Daily Summary (for n8n daily digest) ──────────────────────
CREATE OR REPLACE VIEW v_daily_summary AS
SELECT
  DATE(ae.created_at) as date,
  COUNT(DISTINCT ae.user_session_id) as unique_sessions,
  COUNT(*) as total_events,
  COUNT(*) FILTER (WHERE ae.event_name = 'roi_expand') as roi_expands,
  COUNT(*) FILTER (WHERE ae.event_name = 'wizard_start') as wizard_starts,
  COUNT(*) FILTER (WHERE ae.event_name = 'wizard_complete') as wizard_completions,
  COUNT(*) FILTER (WHERE ae.event_name = 'whatsapp_click') as whatsapp_clicks,
  COUNT(*) FILTER (WHERE ae.event_name = 'lead_created') as leads_created,
  COUNT(*) FILTER (WHERE ae.vertical = 'solar') as solar_events,
  COUNT(*) FILTER (WHERE ae.vertical = 'ev') as ev_events,
  COUNT(*) FILTER (WHERE ae.audience = 'b2b') as b2b_events,
  COUNT(*) FILTER (WHERE ae.audience = 'b2c') as b2c_events,
  (SELECT COUNT(*) FROM news_articles WHERE DATE(fetched_at) = DATE(ae.created_at)) as news_articles_fetched,
  (SELECT COUNT(*) FROM whatsapp_messages WHERE DATE(created_at) = DATE(ae.created_at)) as whatsapp_messages_sent,
  (SELECT COUNT(*) FROM intent_signals WHERE DATE(created_at) = DATE(ae.created_at) AND intent_level IN ('boiling', 'immediate', 'declared')) as high_intent_signals
FROM analytics_events ae
WHERE ae.created_at > NOW() - INTERVAL '90 days'
GROUP BY DATE(ae.created_at)
ORDER BY date DESC;

COMMENT ON VIEW v_daily_summary IS 'Comprehensive daily summary. Used by n8n for daily digest.';

-- ── View 10: Growth Health (single-row snapshot) ──────────────────────
CREATE OR REPLACE VIEW v_growth_health AS
SELECT
  (SELECT COUNT(*) FROM analytics_events WHERE created_at > NOW() - INTERVAL '24 hours') as events_24h,
  (SELECT COUNT(*) FROM analytics_events WHERE event_name = 'lead_created' AND created_at > NOW() - INTERVAL '24 hours') as leads_24h,
  (SELECT COUNT(*) FROM analytics_events WHERE event_name = 'wizard_complete' AND created_at > NOW() - INTERVAL '24 hours') as completions_24h,
  (SELECT COUNT(*) FROM intent_signals WHERE intent_level IN ('boiling', 'immediate', 'declared') AND last_signal_at > NOW() - INTERVAL '24 hours') as high_intent_24h,
  (SELECT COUNT(*) FROM whatsapp_messages WHERE created_at > NOW() - INTERVAL '24 hours') as whatsapp_24h,
  (SELECT COUNT(*) FROM demand_notifications WHERE created_at > NOW() - INTERVAL '24 hours') as demand_notifications_24h,
  (SELECT COUNT(*) FROM news_articles WHERE fetched_at > NOW() - INTERVAL '24 hours') as news_24h,
  (SELECT COUNT(*) FROM content WHERE created_at > NOW() - INTERVAL '24 hours') as content_pieces_24h,
  NOW() as snapshot_at;

COMMENT ON VIEW v_growth_health IS 'Single-row health snapshot. Used for monitoring and alerting.';

-- ── Grant read access to Metabase user ────────────────────────────────
-- CREATE ROLE metabase_readonly WITH LOGIN PASSWORD 'your_secure_password';
-- GRANT CONNECT ON DATABASE availsolar_db TO metabase_readonly;
-- GRANT USAGE ON SCHEMA public TO metabase_readonly;
-- GRANT SELECT ON ALL TABLES IN SCHEMA public TO metabase_readonly;
-- ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO metabase_readonly;
