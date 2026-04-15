class CreateGrowthAnalyticsTables < ActiveRecord::Migration[7.1]
  def change
    # ── analytics_events (from PostHog webhook) ──────────────────────
    create_table :analytics_events do |t|
      t.string :event_name, null: false
      t.string :user_session_id
      t.bigint :user_id
      t.string :page_url
      t.string :city
      t.string :state
      t.bigint :company_id
      t.bigint :category_id
      t.string :vertical, limit: 20
      t.string :audience, limit: 20
      t.string :utm_source
      t.string :utm_medium
      t.string :utm_campaign
      t.string :utm_content
      t.string :referrer
      t.jsonb :metadata
      t.datetime :created_at, null: false

      t.index :user_session_id
      t.index :event_name
      t.index :city
      t.index [:utm_campaign, :utm_source]
      t.index :created_at
    end

    execute "CREATE INDEX idx_analytics_events_event_created ON analytics_events(event_name, created_at DESC)"
    execute "CREATE INDEX idx_analytics_events_city_vertical ON analytics_events(city, vertical)"

    # ── intent_signals ───────────────────────────────────────────────
    create_table :intent_signals do |t|
      t.string :session_id, null: false
      t.bigint :user_id
      t.string :city
      t.string :state
      t.string :vertical, limit: 20
      t.string :audience, limit: 20
      t.jsonb :signals
      t.decimal :intent_score, precision: 5, scale: 2
      t.string :intent_level, limit: 20
      t.decimal :confidence, precision: 3, scale: 2
      t.datetime :last_signal_at
      t.datetime :created_at, null: false
      t.datetime :updated_at, null: false

      t.index :session_id, unique: true
      t.index :intent_level
      t.index :intent_score
    end

    # ── intent_score_histories ───────────────────────────────────────
    create_table :intent_score_histories do |t|
      t.string :session_id
      t.string :previous_level, limit: 20
      t.string :new_level, limit: 20
      t.decimal :previous_score, precision: 5, scale: 2
      t.decimal :new_score, precision: 5, scale: 2
      t.string :trigger_event
      t.datetime :created_at, null: false

      t.index :session_id
      t.index :created_at
    end

    # ── news_articles ────────────────────────────────────────────────
    create_table :news_articles do |t|
      t.string :title
      t.string :url, null: false
      t.string :source
      t.datetime :published_at
      t.datetime :fetched_at
      t.string :category, limit: 50
      t.string :vertical, limit: 20
      t.string :audience, limit: 20
      t.string :sentiment, limit: 20
      t.string :urgency, limit: 20
      t.decimal :relevance_score, precision: 3, scale: 2
      t.text :summary_pt
      t.jsonb :content_angles
      t.jsonb :suggested_channels
      t.string :suggested_cta, limit: 50
      t.boolean :used_in_content, default: false
      t.datetime :created_at, null: false

      t.index :url, unique: true
      t.index :relevance_score
      t.index :urgency
      t.index [:used_in_content, :relevance_score], where: "used_in_content = false"
    end

    # ── classified_topics ────────────────────────────────────────────
    create_table :classified_topics do |t|
      t.string :source_type, limit: 50
      t.bigint :source_id
      t.string :vertical, limit: 20
      t.string :category
      t.string :city
      t.string :state
      t.string :audience, limit: 20
      t.string :funnel_stage, limit: 20
      t.string :topic
      t.string :sentiment, limit: 20
      t.string :urgency, limit: 20
      t.decimal :relevance_score, precision: 3, scale: 2
      t.decimal :lead_potential, precision: 3, scale: 2
      t.boolean :content_worthy, default: false
      t.jsonb :content_angles
      t.boolean :ready_for_content, default: false
      t.datetime :processed_at
      t.datetime :created_at, null: false

      t.index :ready_for_content, where: "ready_for_content = true"
      t.index :urgency
    end

    # ── content ──────────────────────────────────────────────────────
    create_table :content do |t|
      t.string :campaign_id
      t.bigint :topic_id
      t.string :source, limit: 20
      t.string :content_type, limit: 50
      t.string :vertical, limit: 20
      t.string :audience, limit: 20
      t.string :city
      t.string :status, limit: 20
      t.jsonb :content_pack
      t.jsonb :publish_urls
      t.datetime :scheduled_for
      t.datetime :published_at
      t.jsonb :performance
      t.string :created_by, limit: 100
      t.datetime :created_at, null: false
      t.datetime :updated_at, null: false

      t.index :campaign_id, unique: true
      t.index :status
      t.index [:status, :scheduled_for], where: "status = 'scheduled'"
    end

    # ── demand_notifications ─────────────────────────────────────────
    create_table :demand_notifications do |t|
      t.bigint :lead_id
      t.bigint :intent_signal_id
      t.string :notification_type, limit: 50
      t.string :channel, limit: 20
      t.string :status, limit: 20
      t.string :sla_window, limit: 20
      t.datetime :sla_expires_at
      t.datetime :responded_at
      t.datetime :created_at, null: false

      t.index :lead_id
      t.index :status
    end

    # ── whatsapp_messages ────────────────────────────────────────────
    create_table :whatsapp_messages do |t|
      t.bigint :lead_id
      t.bigint :company_id
      t.string :direction, limit: 10
      t.string :message_type, limit: 50
      t.string :phone, limit: 30
      t.text :message_preview
      t.string :status, limit: 20
      t.text :evolution_response
      t.datetime :reply_received_at
      t.datetime :created_at, null: false

      t.index :lead_id
      t.index :status
    end

    # ── growth_insights ──────────────────────────────────────────────
    create_table :growth_insights do |t|
      t.date :period_start
      t.date :period_end
      t.string :insight_type, limit: 50
      t.jsonb :insight_data
      t.decimal :confidence, precision: 3, scale: 2
      t.boolean :actioned, default: false
      t.datetime :created_at, null: false

      t.index :period_start
      t.index :insight_type
    end

    # ── content_templates ────────────────────────────────────────────
    create_table :content_templates do |t|
      t.string :vertical, limit: 20
      t.string :audience, limit: 20
      t.string :content_type, limit: 50
      t.string :template_key, limit: 100
      t.text :template_text
      t.decimal :weight, precision: 5, scale: 2, default: 1.0
      t.integer :impressions, default: 0
      t.integer :conversions, default: 0
      t.decimal :conversion_rate, precision: 5, scale: 4
      t.datetime :last_updated_at
      t.datetime :created_at, null: false

      t.index [:vertical, :audience, :template_key]
    end

    # ── daily_growth_snapshots ───────────────────────────────────────
    create_table :daily_growth_snapshots do |t|
      t.date :snapshot_date, null: false
      t.integer :total_page_views, default: 0
      t.integer :total_sessions, default: 0
      t.integer :roi_expands, default: 0
      t.integer :wizard_starts, default: 0
      t.integer :wizard_completions, default: 0
      t.integer :whatsapp_clicks, default: 0
      t.integer :compare_views, default: 0
      t.integer :leads_created, default: 0
      t.decimal :view_to_wizard_rate, precision: 5, scale: 4
      t.decimal :wizard_to_complete_rate, precision: 5, scale: 4
      t.decimal :wizard_to_lead_rate, precision: 5, scale: 4
      t.integer :solar_events, default: 0
      t.integer :ev_events, default: 0
      t.integer :b2b_events, default: 0
      t.integer :b2c_events, default: 0
      t.jsonb :top_cities
      t.jsonb :top_campaigns
      t.jsonb :top_content
      t.integer :linkedin_followers, default: 0
      t.integer :instagram_followers, default: 0
      t.integer :x_followers, default: 0
      t.jsonb :metadata
      t.datetime :created_at, null: false

      t.index :snapshot_date, unique: true
    end

    # ── social_post_analytics ────────────────────────────────────────
    create_table :social_post_analytics do |t|
      t.string :post_id, limit: 200
      t.string :platform, limit: 20
      t.bigint :content_id
      t.datetime :published_at
      t.integer :impressions, default: 0
      t.integer :engagements, default: 0
      t.integer :link_clicks, default: 0
      t.integer :saves, default: 0
      t.integer :shares, default: 0
      t.integer :comments, default: 0
      t.decimal :ctr, precision: 5, scale: 2
      t.datetime :fetched_at

      t.index :platform
      t.index :ctr
    end

    # ── newsletters ──────────────────────────────────────────────────
    create_table :newsletters do |t|
      t.integer :issue_number
      t.string :subject, limit: 300
      t.text :content_html
      t.string :status, limit: 20
      t.datetime :sent_at
      t.integer :recipients_count
      t.decimal :open_rate, precision: 5, scale: 2
      t.decimal :click_rate, precision: 5, scale: 2
      t.datetime :created_at, null: false
    end

    # ── optimization_log ─────────────────────────────────────────────
    create_table :optimization_log do |t|
      t.string :workflow_id, limit: 20
      t.string :optimization_type, limit: 50
      t.jsonb :details
      t.datetime :created_at, null: false

      t.index :workflow_id
      t.index :created_at
    end
  end
end
