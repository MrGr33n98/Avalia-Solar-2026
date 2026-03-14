-- ============================================
-- DASHBOARD DATABASE OPTIMIZATION SUITE
-- Dara Agent (@data-engineer) Performance Enhancement
-- ============================================

-- 1. MATERIALIZED VIEWS FOR DASHBOARD AGGREGATIONS
-- ============================================

-- Company performance aggregation
CREATE MATERIALIZED VIEW IF NOT EXISTS dashboard_company_metrics AS
SELECT 
    c.id,
    c.name,
    c.slug,
    c.created_at,
    COUNT(DISTINCT r.id) as total_reviews,
    AVG(r.rating)::DECIMAL(3,2) as avg_rating,
    COUNT(DISTINCT p.id) as total_products,
    COUNT(DISTINCT l.id) as total_leads,
    COALESCE(SUM(l.estimated_value), 0) as total_pipeline_value,
    -- Performance metrics
    DATE_TRUNC('month', c.created_at) as cohort_month,
    COUNT(DISTINCT r.id) FILTER (WHERE r.created_at >= CURRENT_DATE - INTERVAL '30 days') as reviews_last_30d,
    COUNT(DISTINCT l.id) FILTER (WHERE l.created_at >= CURRENT_DATE - INTERVAL '30 days') as leads_last_30d
FROM companies c
LEFT JOIN reviews r ON c.id = r.company_id AND r.status = 'approved'
LEFT JOIN products p ON c.id = p.company_id AND p.active = true
LEFT JOIN leads l ON c.id = l.company_id 
GROUP BY c.id, c.name, c.slug, c.created_at;

-- Create indexes for the materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_dashboard_company_metrics_id ON dashboard_company_metrics (id);
CREATE INDEX IF NOT EXISTS idx_dashboard_company_metrics_rating ON dashboard_company_metrics (avg_rating DESC);
CREATE INDEX IF NOT EXISTS idx_dashboard_company_metrics_reviews ON dashboard_company_metrics (total_reviews DESC);
CREATE INDEX IF NOT EXISTS idx_dashboard_company_metrics_leads ON dashboard_company_metrics (total_leads DESC);
CREATE INDEX IF NOT EXISTS idx_dashboard_company_metrics_cohort ON dashboard_company_metrics (cohort_month);

-- 2. SYSTEM-WIDE PERFORMANCE METRICS VIEW
-- ============================================

CREATE MATERIALIZED VIEW IF NOT EXISTS dashboard_system_metrics AS
SELECT 
    -- Counts
    COUNT(DISTINCT c.id) as total_companies,
    COUNT(DISTINCT c.id) FILTER (WHERE c.created_at >= CURRENT_DATE - INTERVAL '30 days') as companies_last_30d,
    COUNT(DISTINCT r.id) as total_reviews,
    COUNT(DISTINCT r.id) FILTER (WHERE r.created_at >= CURRENT_DATE - INTERVAL '30 days') as reviews_last_30d,
    COUNT(DISTINCT p.id) as total_products,
    COUNT(DISTINCT p.id) FILTER (WHERE p.created_at >= CURRENT_DATE - INTERVAL '30 days') as products_last_30d,
    COUNT(DISTINCT l.id) as total_leads,
    COUNT(DISTINCT l.id) FILTER (WHERE l.created_at >= CURRENT_DATE - INTERVAL '30 days') as leads_last_30d,
    
    -- Financial metrics
    COALESCE(SUM(l.estimated_value), 0) as total_pipeline_value,
    COALESCE(SUM(l.estimated_value) FILTER (WHERE l.created_at >= CURRENT_DATE - INTERVAL '30 days'), 0) as pipeline_value_last_30d,
    
    -- Performance metrics
    AVG(r.rating)::DECIMAL(3,2) as global_avg_rating,
    COUNT(DISTINCT l.id)::DECIMAL / NULLIF(COUNT(DISTINCT c.id), 0) as leads_per_company,
    COUNT(DISTINCT r.id)::DECIMAL / NULLIF(COUNT(DISTINCT c.id), 0) as reviews_per_company,
    
    -- Growth rates (30-day vs previous 30-day)
    (COUNT(DISTINCT c.id) FILTER (WHERE c.created_at >= CURRENT_DATE - INTERVAL '30 days')::DECIMAL / 
     NULLIF(COUNT(DISTINCT c.id) FILTER (WHERE c.created_at >= CURRENT_DATE - INTERVAL '60 days' 
                                         AND c.created_at < CURRENT_DATE - INTERVAL '30 days'), 0) - 1) * 100 as company_growth_rate,
    
    -- Last updated
    CURRENT_TIMESTAMP as last_updated
FROM companies c
LEFT JOIN reviews r ON c.id = r.company_id AND r.status = 'approved'
LEFT JOIN products p ON c.id = p.company_id AND p.active = true
LEFT JOIN leads l ON c.id = l.company_id;

-- 3. TIME-SERIES PERFORMANCE DATA
-- ============================================

CREATE MATERIALIZED VIEW IF NOT EXISTS dashboard_time_series AS
SELECT 
    DATE_TRUNC('day', generate_series) as date,
    DATE_TRUNC('week', generate_series) as week,
    DATE_TRUNC('month', generate_series) as month,
    -- Companies
    COUNT(DISTINCT c.id) FILTER (WHERE c.created_at::date <= generate_series::date) as cumulative_companies,
    COUNT(DISTINCT c.id) FILTER (WHERE c.created_at::date = generate_series::date) as daily_companies,
    -- Reviews  
    COUNT(DISTINCT r.id) FILTER (WHERE r.created_at::date <= generate_series::date) as cumulative_reviews,
    COUNT(DISTINCT r.id) FILTER (WHERE r.created_at::date = generate_series::date) as daily_reviews,
    AVG(r.rating) FILTER (WHERE r.created_at::date = generate_series::date) as daily_avg_rating,
    -- Leads
    COUNT(DISTINCT l.id) FILTER (WHERE l.created_at::date <= generate_series::date) as cumulative_leads,
    COUNT(DISTINCT l.id) FILTER (WHERE l.created_at::date = generate_series::date) as daily_leads,
    COALESCE(SUM(l.estimated_value) FILTER (WHERE l.created_at::date = generate_series::date), 0) as daily_pipeline_value
FROM generate_series(
    (SELECT MIN(created_at)::date FROM companies),
    CURRENT_DATE,
    '1 day'::interval
) AS generate_series
LEFT JOIN companies c ON c.created_at::date <= generate_series::date
LEFT JOIN reviews r ON r.created_at::date <= generate_series::date AND r.status = 'approved'
LEFT JOIN leads l ON l.created_at::date <= generate_series::date
GROUP BY generate_series;

-- Indexes for time-series data
CREATE INDEX IF NOT EXISTS idx_dashboard_time_series_date ON dashboard_time_series (date DESC);
CREATE INDEX IF NOT EXISTS idx_dashboard_time_series_week ON dashboard_time_series (week DESC);
CREATE INDEX IF NOT EXISTS idx_dashboard_time_series_month ON dashboard_time_series (month DESC);

-- 4. AUTOMATIC REFRESH PROCEDURES
-- ============================================

-- Function to refresh all dashboard materialized views
CREATE OR REPLACE FUNCTION refresh_dashboard_views()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Refresh in dependency order
    REFRESH MATERIALIZED VIEW CONCURRENTLY dashboard_company_metrics;
    REFRESH MATERIALIZED VIEW dashboard_system_metrics;
    REFRESH MATERIALIZED VIEW CONCURRENTLY dashboard_time_series;
    
    -- Log the refresh
    INSERT INTO system_logs (event_type, details, created_at)
    VALUES ('dashboard_refresh', 'Materialized views refreshed', CURRENT_TIMESTAMP);
END;
$$;

-- 5. OPTIMIZED QUERY FUNCTIONS FOR API ENDPOINTS
-- ============================================

-- Get dashboard stats (replaces multiple API calls)
CREATE OR REPLACE FUNCTION get_dashboard_stats()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total_companies', json_build_object(
            'value', total_companies,
            'change', CASE 
                WHEN companies_last_30d > 0 AND total_companies > companies_last_30d 
                THEN ((companies_last_30d::decimal / (total_companies - companies_last_30d)) * 100)::decimal(5,2)
                ELSE 0
            END,
            'label', 'empresas cadastradas'
        ),
        'total_reviews', json_build_object(
            'value', total_reviews,
            'change', CASE 
                WHEN reviews_last_30d > 0 AND total_reviews > reviews_last_30d 
                THEN ((reviews_last_30d::decimal / (total_reviews - reviews_last_30d)) * 100)::decimal(5,2)
                ELSE 0
            END,
            'label', 'avaliações recebidas'
        ),
        'total_leads', json_build_object(
            'value', total_leads,
            'change', CASE 
                WHEN leads_last_30d > 0 AND total_leads > leads_last_30d 
                THEN ((leads_last_30d::decimal / (total_leads - leads_last_30d)) * 100)::decimal(5,2)
                ELSE 0
            END,
            'label', 'leads gerados'
        ),
        'pipeline_value', json_build_object(
            'value', total_pipeline_value,
            'change', CASE 
                WHEN pipeline_value_last_30d > 0 AND total_pipeline_value > pipeline_value_last_30d 
                THEN ((pipeline_value_last_30d::decimal / (total_pipeline_value - pipeline_value_last_30d)) * 100)::decimal(5,2)
                ELSE 0
            END,
            'label', 'valor em pipeline'
        ),
        'performance_metrics', json_build_object(
            'global_avg_rating', global_avg_rating,
            'leads_per_company', leads_per_company,
            'reviews_per_company', reviews_per_company,
            'company_growth_rate', company_growth_rate
        ),
        'last_updated', last_updated
    ) INTO result
    FROM dashboard_system_metrics;
    
    RETURN result;
END;
$$;

-- Get time-series chart data
CREATE OR REPLACE FUNCTION get_dashboard_chart_data(
    metric_type TEXT DEFAULT 'companies',
    time_range TEXT DEFAULT 'monthly',
    start_date DATE DEFAULT CURRENT_DATE - INTERVAL '12 months'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSON;
    time_column TEXT;
    value_column TEXT;
BEGIN
    -- Determine time grouping
    time_column := CASE 
        WHEN time_range = 'daily' THEN 'date'
        WHEN time_range = 'weekly' THEN 'week'  
        WHEN time_range = 'monthly' THEN 'month'
        ELSE 'month'
    END;
    
    -- Determine value column
    value_column := CASE 
        WHEN metric_type = 'companies' THEN 'daily_companies'
        WHEN metric_type = 'reviews' THEN 'daily_reviews'
        WHEN metric_type = 'leads' THEN 'daily_leads'
        WHEN metric_type = 'revenue' THEN 'daily_pipeline_value'
        ELSE 'daily_companies'
    END;
    
    -- Build query dynamically
    EXECUTE format('
        SELECT json_agg(
            json_build_object(
                ''date'', %I,
                ''value'', COALESCE(SUM(%I), 0),
                ''cumulative'', MAX(cumulative_companies)
            ) ORDER BY %I
        )
        FROM dashboard_time_series 
        WHERE %I >= $1
        GROUP BY %I
    ', time_column, value_column, time_column, time_column, time_column)
    INTO result
    USING start_date;
    
    RETURN COALESCE(result, '[]'::json);
END;
$$;

-- 6. REAL-TIME DASHBOARD SUBSCRIPTIONS SETUP
-- ============================================

-- Enable real-time for dashboard views (Supabase)
-- ALTER PUBLICATION supabase_realtime ADD TABLE dashboard_company_metrics;
-- ALTER PUBLICATION supabase_realtime ADD TABLE dashboard_system_metrics;

-- Create trigger to auto-refresh views on data changes
CREATE OR REPLACE FUNCTION trigger_dashboard_refresh()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Async refresh to avoid blocking
    PERFORM pg_notify('dashboard_refresh', 'refresh_needed');
    RETURN COALESCE(NEW, OLD);
END;
$$;

-- Apply triggers to main tables
DROP TRIGGER IF EXISTS companies_dashboard_refresh ON companies;
CREATE TRIGGER companies_dashboard_refresh
    AFTER INSERT OR UPDATE OR DELETE ON companies
    FOR EACH ROW EXECUTE FUNCTION trigger_dashboard_refresh();

DROP TRIGGER IF EXISTS reviews_dashboard_refresh ON reviews;  
CREATE TRIGGER reviews_dashboard_refresh
    AFTER INSERT OR UPDATE OR DELETE ON reviews
    FOR EACH ROW EXECUTE FUNCTION trigger_dashboard_refresh();

DROP TRIGGER IF EXISTS leads_dashboard_refresh ON leads;
CREATE TRIGGER leads_dashboard_refresh
    AFTER INSERT OR UPDATE OR DELETE ON leads
    FOR EACH ROW EXECUTE FUNCTION trigger_dashboard_refresh();

-- 7. PERFORMANCE MONITORING
-- ============================================

-- Create performance monitoring table
CREATE TABLE IF NOT EXISTS dashboard_performance_log (
    id BIGSERIAL PRIMARY KEY,
    query_type TEXT NOT NULL,
    execution_time_ms INTEGER NOT NULL,
    rows_returned INTEGER,
    cache_hit BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Function to log query performance
CREATE OR REPLACE FUNCTION log_dashboard_performance(
    query_type TEXT,
    execution_time_ms INTEGER,
    rows_returned INTEGER DEFAULT NULL,
    cache_hit BOOLEAN DEFAULT false
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO dashboard_performance_log (query_type, execution_time_ms, rows_returned, cache_hit)
    VALUES (query_type, execution_time_ms, rows_returned, cache_hit);
END;
$$;

-- Performance monitoring view
CREATE OR REPLACE VIEW dashboard_performance_stats AS
SELECT 
    query_type,
    COUNT(*) as total_queries,
    AVG(execution_time_ms)::decimal(10,2) as avg_execution_time_ms,
    MAX(execution_time_ms) as max_execution_time_ms,
    MIN(execution_time_ms) as min_execution_time_ms,
    AVG(CASE WHEN cache_hit THEN 1.0 ELSE 0.0 END)::decimal(3,2) as cache_hit_rate,
    AVG(rows_returned)::decimal(10,2) as avg_rows_returned
FROM dashboard_performance_log
WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY query_type
ORDER BY avg_execution_time_ms DESC;

-- ============================================
-- INITIAL SETUP COMMANDS
-- ============================================

-- Refresh all views for the first time
SELECT refresh_dashboard_views();

-- ============================================
-- QUERY EXAMPLES & USAGE
-- ============================================

/*
-- Get optimized dashboard stats
SELECT get_dashboard_stats();

-- Get monthly company growth chart
SELECT get_dashboard_chart_data('companies', 'monthly', '2024-01-01');

-- Get top performing companies
SELECT * FROM dashboard_company_metrics 
ORDER BY total_leads DESC, avg_rating DESC 
LIMIT 10;

-- Get performance monitoring
SELECT * FROM dashboard_performance_stats;

-- Manual refresh if needed
SELECT refresh_dashboard_views();
*/