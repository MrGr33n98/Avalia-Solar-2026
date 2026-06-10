# frozen_string_literal: true

module Analytics
  class BackfillWorker
    include Sidekiq::Worker
    include Analytics::WorkerLogging
    sidekiq_options queue: :maintenance, retry: 1
    PROFILE_VIEW_EVENTS = ['profile_view', 'Company Profile Viewed', 'company_profile_viewed'].freeze
    CTA_CLICK_EVENTS = ['cta_click', 'CTA Clicked', 'cta_clicked', 'company_cta_clicked', 'company_cta_quote'].freeze
    WHATSAPP_CLICK_EVENTS = ['whatsapp_click', 'WhatsApp CTA Clicked', 'company_cta_whatsapp'].freeze
    EMAIL_CLICK_EVENTS = ['Email CTA Clicked', 'email_click', 'company_cta_email'].freeze
    PHONE_CLICK_EVENTS = ['Phone CTA Clicked', 'phone_click', 'company_cta_phone'].freeze
    WEBSITE_CLICK_EVENTS = ['Website CTA Clicked', 'website_click', 'company_cta_website'].freeze
    LEAD_EVENTS = ['lead_created', 'Lead Form Submitted', 'Quote Request CTA Clicked'].freeze
    REVIEW_EVENTS = ['review_created'].freeze

    def perform(target_date = nil)
      return unless postgresql?
      
      day = target_date ? Date.parse(target_date) : Date.yesterday
      recalculate_day(day)
      recalculate_day(Date.current) if target_date.nil?
    end

    def recalculate_day(day)
      start_ts = day.to_time.in_time_zone('UTC').beginning_of_day
      end_ts   = (day + 1.day).to_time.in_time_zone('UTC').beginning_of_day
      start_time = Time.current

      sql = <<~SQL
        INSERT INTO company_daily_stats (company_id, day, profile_views, cta_clicks, whatsapp_clicks, email_clicks, phone_clicks, website_clicks, leads, reviews, updated_at, created_at)
        SELECT 
          company_id, $1,
          COUNT(*) FILTER (WHERE #{event_type_in(PROFILE_VIEW_EVENTS)}),
          COUNT(*) FILTER (WHERE #{event_type_in(CTA_CLICK_EVENTS)}),
          COUNT(*) FILTER (WHERE #{event_type_in(WHATSAPP_CLICK_EVENTS)} OR #{cta_type_condition('whatsapp')}),
          COUNT(*) FILTER (WHERE #{event_type_in(EMAIL_CLICK_EVENTS)} OR #{cta_type_condition('email')}),
          COUNT(*) FILTER (WHERE #{event_type_in(PHONE_CLICK_EVENTS)} OR #{cta_type_condition('phone')}),
          COUNT(*) FILTER (WHERE #{event_type_in(WEBSITE_CLICK_EVENTS)} OR #{cta_type_condition('website')}),
          COUNT(*) FILTER (WHERE #{event_type_in(LEAD_EVENTS)}),
          COUNT(*) FILTER (WHERE #{event_type_in(REVIEW_EVENTS)}),
          NOW(), NOW()
        FROM platform_events
        WHERE occurred_at >= $2 AND occurred_at < $3
          AND company_id IS NOT NULL
        GROUP BY 1, 2
        ON CONFLICT (company_id, day) DO UPDATE SET
          profile_views = EXCLUDED.profile_views,
          cta_clicks = EXCLUDED.cta_clicks,
          whatsapp_clicks = EXCLUDED.whatsapp_clicks,
          email_clicks = EXCLUDED.email_clicks,
          phone_clicks = EXCLUDED.phone_clicks,
          website_clicks = EXCLUDED.website_clicks,
          leads = EXCLUDED.leads,
          reviews = EXCLUDED.reviews,
          updated_at = NOW()
        RETURNING 1;
      SQL

      res = ActiveRecord::Base.connection.exec_query(ActiveRecord::Base.sanitize_sql_array([sql, day, start_ts, end_ts]))
      dur = ((Time.current - start_time) * 1000).to_i
      log_run('Backfill', day.to_s, res.rows.size, dur)
    end

    private

    def postgresql?
      ActiveRecord::Base.connection.adapter_name =~ /postgre/i
    end

    def event_type_in(values)
      quoted_values = values.map { |value| ActiveRecord::Base.connection.quote(value) }.join(', ')
      "event_type IN (#{quoted_values})"
    end

    def cta_type_condition(cta_type)
      "(#{event_type_in(CTA_CLICK_EVENTS)} AND payload->>'cta_type' = #{ActiveRecord::Base.connection.quote(cta_type)})"
    end
  end
end
