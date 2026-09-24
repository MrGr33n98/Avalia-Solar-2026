# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[7.0].define(version: 2026_09_22_140000) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "btree_gin"
  enable_extension "pg_trgm"
  enable_extension "pgcrypto"
  enable_extension "plpgsql"
  enable_extension "unaccent"

  create_table "action_text_rich_texts", force: :cascade do |t|
    t.string "name", null: false
    t.text "body"
    t.string "record_type", null: false
    t.bigint "record_id", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["record_type", "record_id", "name"], name: "index_action_text_rich_texts_uniqueness", unique: true
  end

  create_table "active_admin_comments", force: :cascade do |t|
    t.string "namespace"
    t.text "body"
    t.string "resource_type"
    t.bigint "resource_id"
    t.string "author_type"
    t.bigint "author_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["author_type", "author_id"], name: "index_active_admin_comments_on_author"
    t.index ["namespace"], name: "index_active_admin_comments_on_namespace"
    t.index ["resource_type", "resource_id"], name: "index_active_admin_comments_on_resource"
  end

  create_table "active_storage_attachments", force: :cascade do |t|
    t.string "name", null: false
    t.string "record_type", null: false
    t.bigint "record_id", null: false
    t.bigint "blob_id", null: false
    t.datetime "created_at", null: false
    t.index ["blob_id"], name: "index_active_storage_attachments_on_blob_id"
    t.index ["record_type", "record_id", "name", "blob_id"], name: "index_active_storage_attachments_uniqueness", unique: true
  end

  create_table "active_storage_blobs", force: :cascade do |t|
    t.string "key", null: false
    t.string "filename", null: false
    t.string "content_type"
    t.text "metadata"
    t.string "service_name", null: false
    t.bigint "byte_size", null: false
    t.string "checksum"
    t.datetime "created_at", null: false
    t.index ["key"], name: "index_active_storage_blobs_on_key", unique: true
  end

  create_table "active_storage_variant_records", force: :cascade do |t|
    t.bigint "blob_id", null: false
    t.string "variation_digest", null: false
    t.index ["blob_id", "variation_digest"], name: "index_active_storage_variant_records_uniqueness", unique: true
  end

  create_table "admin_users", force: :cascade do |t|
    t.string "email", default: "", null: false
    t.string "encrypted_password", default: "", null: false
    t.string "reset_password_token"
    t.datetime "reset_password_sent_at"
    t.datetime "remember_created_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.datetime "avatar_uploaded_at"
    t.string "name"
    t.text "bio"
    t.string "two_factor_secret"
    t.text "two_factor_recovery_codes"
    t.boolean "two_factor_enabled", default: false, null: false
    t.string "billing_role", comment: "Papel de billing: nil=leitura, support, finance, super_admin"
    t.index ["billing_role"], name: "index_admin_users_on_billing_role", where: "(billing_role IS NOT NULL)"
    t.index ["email"], name: "index_admin_users_on_email", unique: true
    t.index ["reset_password_token"], name: "index_admin_users_on_reset_password_token", unique: true
  end

  create_table "analytics_event_dedup", primary_key: "event_id", id: :text, force: :cascade do |t|
    t.datetime "inserted_at", default: -> { "now()" }, null: false
    t.index ["inserted_at"], name: "index_analytics_event_dedup_on_inserted_at"
  end

  create_table "analytics_events", force: :cascade do |t|
    t.integer "company_id", null: false
    t.integer "user_id"
    t.string "event_type", null: false
    t.json "metadata", default: {}, null: false
    t.datetime "tracked_at", default: -> { "CURRENT_TIMESTAMP" }, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "event_id"
    t.string "action"
    t.integer "duration_ms"
    t.string "element_id"
    t.string "element_type"
    t.integer "position_x"
    t.integer "position_y"
    t.integer "viewport_width"
    t.integer "viewport_height"
    t.string "anonymous_id"
    t.jsonb "context", default: {}
    t.bigint "brand_id"
    t.string "brand_slug"
    t.string "app_key"
    t.index ["action"], name: "index_analytics_events_on_action"
    t.index ["anonymous_id"], name: "index_analytics_events_on_anonymous_id"
    t.index ["app_key", "tracked_at"], name: "index_analytics_events_on_app_key_time"
    t.index ["brand_id", "event_type", "tracked_at"], name: "index_analytics_events_on_brand_event_time"
    t.index ["brand_id", "tracked_at"], name: "index_analytics_events_on_brand_time"
    t.index ["company_id", "action"], name: "idx_analytics_company_action", where: "(company_id IS NOT NULL)"
    t.index ["company_id", "event_type", "created_at"], name: "idx_analytics_company_event_time"
    t.index ["company_id", "event_type", "tracked_at"], name: "index_analytics_events_company_event_time"
    t.index ["company_id", "tracked_at"], name: "index_analytics_events_on_company_id_and_tracked_at"
    t.index ["element_type"], name: "index_analytics_events_on_element_type"
    t.index ["event_id"], name: "index_analytics_events_on_event_id", unique: true
    t.index ["event_type", "action"], name: "index_analytics_events_on_event_type_and_action"
    t.index ["event_type", "tracked_at"], name: "index_analytics_events_on_event_type_and_tracked_at"
  end

  create_table "analytics_processing_state", primary_key: "pipeline_name", id: :text, force: :cascade do |t|
    t.datetime "last_processed_at", null: false
    t.datetime "updated_at", default: -> { "now()" }, null: false
  end

  create_table "analytics_reconciliations", force: :cascade do |t|
    t.integer "company_id", null: false
    t.date "day", null: false
    t.string "metric_name", null: false
    t.integer "canonical_value", default: 0
    t.integer "observed_value", default: 0
    t.integer "delta_abs", default: 0
    t.decimal "delta_percent", precision: 10, scale: 4, default: "0.0"
    t.string "status", default: "ok"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["company_id", "day", "metric_name"], name: "idx_analytics_recon_unique", unique: true
    t.index ["day"], name: "index_analytics_reconciliations_on_day"
    t.index ["status"], name: "index_analytics_reconciliations_on_status"
  end

  create_table "anonymous_sessions", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.string "anonymous_id", null: false
    t.bigint "user_id"
    t.bigint "company_id"
    t.string "ip_hash"
    t.string "user_agent_hash"
    t.string "device_fingerprint"
    t.string "device_type"
    t.string "utm_source"
    t.string "utm_medium"
    t.string "utm_campaign"
    t.string "utm_content"
    t.string "referrer_domain"
    t.string "landing_page"
    t.string "exit_page"
    t.string "country_code"
    t.string "region"
    t.string "city"
    t.string "timezone"
    t.jsonb "visited_company_ids", default: []
    t.jsonb "visited_pages", default: []
    t.integer "pageviews_count", default: 0
    t.integer "session_duration_sec", default: 0
    t.datetime "first_seen_at"
    t.datetime "last_seen_at"
    t.string "status", default: "anonymous"
    t.datetime "identified_at"
    t.jsonb "stitch_metadata", default: {}
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["anonymous_id"], name: "index_anonymous_sessions_on_anonymous_id", unique: true
    t.index ["company_id"], name: "index_anonymous_sessions_on_company_id"
    t.index ["first_seen_at"], name: "index_anonymous_sessions_on_first_seen_at"
    t.index ["ip_hash", "user_agent_hash"], name: "idx_anon_sessions_fingerprint"
    t.index ["last_seen_at"], name: "index_anonymous_sessions_on_last_seen_at"
    t.index ["status"], name: "index_anonymous_sessions_on_status"
    t.index ["user_id"], name: "index_anonymous_sessions_on_user_id"
    t.index ["visited_company_ids"], name: "index_anonymous_sessions_on_visited_company_ids", using: :gin
  end

  create_table "articles", force: :cascade do |t|
    t.string "title"
    t.text "content"
    t.bigint "category_id", null: false
    t.bigint "product_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.bigint "company_id"
    t.boolean "sponsored", default: false
    t.string "sponsored_label"
    t.string "slug"
    t.text "excerpt"
    t.string "meta_title"
    t.string "meta_description"
    t.datetime "published_at"
    t.string "status"
    t.boolean "featured"
    t.integer "views_count"
    t.bigint "author_id"
    t.string "seo_title"
    t.text "seo_description"
    t.string "seo_keywords"
    t.index ["author_id"], name: "index_articles_on_author_id"
    t.index ["category_id"], name: "index_articles_on_category_id"
    t.index ["company_id", "sponsored"], name: "index_articles_on_company_sponsored"
    t.index ["company_id"], name: "index_articles_on_company_id"
    t.index ["created_at"], name: "index_articles_on_created_at"
    t.index ["id"], name: "index_articles_on_sponsored_true", where: "(sponsored = true)"
    t.index ["product_id"], name: "index_articles_on_product_id"
    t.index ["slug"], name: "index_articles_on_slug"
  end

  create_table "articles_companies", id: false, force: :cascade do |t|
    t.bigint "article_id", null: false
    t.bigint "company_id", null: false
  end

  create_table "badges", force: :cascade do |t|
    t.string "name"
    t.text "description"
    t.integer "position"
    t.integer "year"
    t.string "edition"
    t.string "image"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.boolean "active", default: true, null: false
    t.string "category_label"
    t.string "public_slug"
    t.index ["public_slug"], name: "index_badges_on_public_slug", unique: true
  end

  create_table "banner_addon_subscriptions", force: :cascade do |t|
    t.bigint "company_id", null: false
    t.bigint "banner_id"
    t.bigint "banner_addon_id", null: false
    t.bigint "legacy_source_id"
    t.string "legacy_migration_status"
    t.integer "price_paid_cents", null: false
    t.integer "discount_cents", default: 0, null: false
    t.datetime "starts_at"
    t.datetime "ends_at"
    t.string "status", default: "pending_payment", null: false
    t.string "payment_provider"
    t.string "payment_reference"
    t.datetime "activated_at"
    t.datetime "cancelled_at"
    t.jsonb "addon_snapshot", default: {}, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "checkout_session_id"
    t.string "idempotency_key"
    t.text "checkout_url"
    t.index ["banner_addon_id"], name: "index_banner_addon_subscriptions_on_banner_addon_id"
    t.index ["banner_id"], name: "index_banner_addon_subscriptions_on_banner_id"
    t.index ["checkout_session_id"], name: "index_banner_addon_subscriptions_on_checkout_session_id"
    t.index ["company_id", "idempotency_key"], name: "idx_banner_addon_subscriptions_idempotency", unique: true, where: "(idempotency_key IS NOT NULL)"
    t.index ["company_id"], name: "index_banner_addon_subscriptions_on_company_id"
    t.index ["ends_at"], name: "index_banner_addon_subscriptions_on_ends_at"
    t.index ["payment_reference"], name: "index_banner_addon_subscriptions_on_payment_reference"
    t.index ["status"], name: "index_banner_addon_subscriptions_on_status"
    t.check_constraint "ends_at > starts_at", name: "ck_banner_addon_subs_valid_dates"
  end

  create_table "banner_addons", force: :cascade do |t|
    t.string "name", null: false
    t.string "code", null: false
    t.text "description"
    t.integer "price_cents", default: 0, null: false
    t.integer "promotional_price_cents"
    t.string "currency", default: "BRL", null: false
    t.integer "duration_days", default: 30, null: false
    t.string "category"
    t.jsonb "benefits", default: [], null: false
    t.jsonb "rules", default: {}, null: false
    t.boolean "is_active", default: true, null: false
    t.boolean "stackable", default: false, null: false
    t.boolean "automatic_application", default: false, null: false
    t.integer "priority_boost", default: 0, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["category"], name: "index_banner_addons_on_category"
    t.index ["code"], name: "index_banner_addons_on_code", unique: true
    t.index ["is_active"], name: "index_banner_addons_on_is_active"
  end

  create_table "banner_audit_logs", force: :cascade do |t|
    t.string "auditable_type", null: false
    t.bigint "auditable_id", null: false
    t.string "actor_type"
    t.bigint "actor_id"
    t.string "source"
    t.string "action", null: false
    t.jsonb "changes_json", default: {}, null: false
    t.jsonb "metadata_json", default: {}, null: false
    t.string "reason"
    t.string "ip_address"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["action"], name: "index_banner_audit_logs_on_action"
    t.index ["actor_type", "actor_id"], name: "index_banner_audit_logs_on_actor"
    t.index ["auditable_type", "auditable_id"], name: "index_banner_audit_logs_on_auditable"
    t.index ["source"], name: "index_banner_audit_logs_on_source"
  end

  create_table "banner_daily_stats", force: :cascade do |t|
    t.bigint "banner_id", null: false
    t.date "day", null: false
    t.integer "views_count", default: 0, null: false
    t.integer "clicks_count", default: 0, null: false
    t.decimal "ctr", default: "0.0", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.integer "leads_count", default: 0, null: false
    t.integer "cost_cents", default: 0, null: false
    t.index ["banner_id", "day"], name: "index_banner_daily_stats_on_banner_id_and_day", unique: true
    t.index ["banner_id"], name: "index_banner_daily_stats_on_banner_id"
  end

  create_table "banner_events", force: :cascade do |t|
    t.bigint "banner_id", null: false
    t.bigint "company_id"
    t.string "event_type", null: false
    t.string "ip_hash"
    t.string "user_agent_hash"
    t.string "referrer"
    t.json "utm_json", default: {}, null: false
    t.json "metadata_json", default: {}, null: false
    t.datetime "tracked_at", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "event_key"
    t.string "page_path"
    t.string "slot_key"
    t.string "placement"
    t.string "utm_source"
    t.string "utm_medium"
    t.string "utm_campaign"
    t.string "utm_term"
    t.string "utm_content"
    t.string "delivery_id"
    t.string "impression_instance_id"
    t.string "click_instance_id"
    t.boolean "valid_for_reporting", default: true, null: false
    t.integer "fraud_score", default: 0, null: false
    t.string "discard_reason"
    t.index ["banner_id", "event_type", "placement"], name: "index_banner_events_on_banner_id_and_event_type_and_placement"
    t.index ["banner_id", "event_type", "tracked_at"], name: "idx_banner_events_analytics", order: { tracked_at: :desc }
    t.index ["banner_id"], name: "index_banner_events_on_banner_id"
    t.index ["click_instance_id"], name: "idx_banner_events_click_instance", unique: true, where: "(((event_type)::text = 'click'::text) AND (click_instance_id IS NOT NULL))"
    t.index ["company_id"], name: "index_banner_events_on_company_id"
    t.index ["delivery_id"], name: "index_banner_events_on_delivery_id"
    t.index ["event_key"], name: "index_banner_events_on_event_key", unique: true, where: "(event_key IS NOT NULL)"
    t.index ["event_type"], name: "index_banner_events_on_event_type"
    t.index ["impression_instance_id"], name: "idx_banner_events_impression_instance", unique: true, where: "(((event_type)::text = 'impression'::text) AND (impression_instance_id IS NOT NULL))"
    t.index ["tracked_at", "banner_id", "event_type"], name: "idx_banner_events_reporting_window", where: "(valid_for_reporting = true)"
    t.index ["tracked_at"], name: "index_banner_events_on_tracked_at"
    t.index ["valid_for_reporting"], name: "index_banner_events_on_valid_for_reporting"
  end

  create_table "banner_globals", force: :cascade do |t|
    t.string "title", null: false
    t.string "link", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
  end

  create_table "banner_offers", force: :cascade do |t|
    t.string "name", null: false
    t.integer "price_cents", default: 0, null: false
    t.string "currency", default: "BRL", null: false
    t.integer "duration_days", default: 30, null: false
    t.json "rules_json", default: {}, null: false
    t.boolean "active", default: true, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["active"], name: "index_banner_offers_on_active"
  end

  create_table "banner_subscriptions", force: :cascade do |t|
    t.bigint "company_id", null: false
    t.bigint "banner_offer_id", null: false
    t.string "status", default: "pending_payment", null: false
    t.datetime "starts_at"
    t.datetime "ends_at"
    t.string "provider"
    t.string "checkout_session_id"
    t.string "payment_reference"
    t.datetime "activated_at"
    t.datetime "canceled_at"
    t.string "failure_reason"
    t.json "metadata_json", default: {}, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["banner_offer_id"], name: "index_banner_subscriptions_on_banner_offer_id"
    t.index ["checkout_session_id"], name: "index_banner_subscriptions_on_checkout_session_id"
    t.index ["company_id", "status"], name: "idx_banner_subs_company_active", where: "((status)::text = 'active'::text)"
    t.index ["company_id"], name: "index_banner_subscriptions_on_company_id"
    t.index ["payment_reference"], name: "index_banner_subscriptions_on_payment_reference"
    t.index ["status", "created_at"], name: "index_banner_subscriptions_on_status_and_created_at"
    t.index ["status"], name: "index_banner_subscriptions_on_status"
    t.check_constraint "created_at <= ends_at", name: "ck_banner_subs_valid_dates"
  end

  create_table "banners", force: :cascade do |t|
    t.string "title"
    t.string "image_url"
    t.string "link"
    t.boolean "active", default: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.bigint "category_id"
    t.boolean "sponsored", default: false
    t.string "banner_type"
    t.string "position"
    t.datetime "start_date"
    t.datetime "end_date"
    t.bigint "company_id"
    t.string "moderation_status", default: "draft"
    t.integer "priority", default: 100
    t.string "slot_key"
    t.bigint "approved_by_admin_user_id"
    t.datetime "approved_at"
    t.text "rejected_reason"
    t.integer "width"
    t.integer "height"
    t.string "target_states", default: [], array: true
    t.string "target_cities", default: [], array: true
    t.string "alt_text"
    t.bigint "financial_institution_id"
    t.bigint "financing_option_id"
    t.index ["active", "moderation_status", "position"], name: "idx_banners_active_approved", where: "((active = true) AND ((moderation_status)::text = 'approved'::text))"
    t.index ["approved_by_admin_user_id"], name: "index_banners_on_approved_by_admin_user_id"
    t.index ["category_id"], name: "index_banners_on_category_id"
    t.index ["company_id"], name: "index_banners_on_company_id"
    t.index ["end_date"], name: "index_banners_on_end_date"
    t.index ["financial_institution_id"], name: "index_banners_on_financial_institution_id"
    t.index ["financing_option_id"], name: "index_banners_on_financing_option_id"
    t.index ["moderation_status"], name: "index_banners_on_moderation_status"
    t.index ["priority", "sponsored", "created_at"], name: "idx_banners_priority_order", where: "((active = true) AND ((moderation_status)::text = 'approved'::text))"
    t.index ["priority"], name: "index_banners_on_priority"
    t.index ["slot_key"], name: "index_banners_on_slot_key"
    t.index ["start_date", "end_date"], name: "idx_banners_date_range", where: "(active = true)"
    t.index ["start_date"], name: "index_banners_on_start_date"
  end

  create_table "banners_categories", id: false, force: :cascade do |t|
    t.bigint "banner_id", null: false
    t.bigint "category_id", null: false
    t.index ["banner_id", "category_id"], name: "index_banners_categories_unique", unique: true
    t.index ["banner_id"], name: "index_banners_categories_on_banner_id"
    t.index ["category_id"], name: "index_banners_categories_on_category_id"
  end

  create_table "billing_admin_actions", force: :cascade do |t|
    t.bigint "admin_user_id", null: false, comment: "Admin que executou a ação"
    t.bigint "company_id", null: false, comment: "Empresa afetada pela ação"
    t.bigint "company_subscription_id", comment: "CompanySubscription afetada (nullable — pode não existir ainda)"
    t.string "action_type", null: false, comment: "Tipo da ação: sync_stripe|mark_enterprise|force_downgrade|cancel_at_period_end|emergency_reset|add_note|extend_trial|enterprise_lead_convert"
    t.text "justification", null: false, comment: "Justificativa obrigatória para toda ação manual"
    t.jsonb "metadata", default: {}, comment: "Dados contextuais da ação (reason, stripe_id, etc.)"
    t.datetime "performed_at", null: false, comment: "Timestamp da execução da ação"
    t.string "ip_address", comment: "IP do admin (do request HTTP)"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["action_type"], name: "index_billing_admin_actions_on_action_type"
    t.index ["admin_user_id", "performed_at"], name: "idx_billing_admin_actions_admin_time"
    t.index ["admin_user_id"], name: "index_billing_admin_actions_on_admin_user_id"
    t.index ["company_id", "performed_at"], name: "idx_billing_admin_actions_company_time"
    t.index ["company_id"], name: "index_billing_admin_actions_on_company_id"
    t.index ["performed_at"], name: "index_billing_admin_actions_on_performed_at"
  end

  create_table "billing_audit_logs", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.bigint "company_id", null: false
    t.integer "action"
    t.integer "plan_id"
    t.jsonb "metadata"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["company_id"], name: "index_billing_audit_logs_on_company_id"
    t.index ["user_id"], name: "index_billing_audit_logs_on_user_id"
  end

  create_table "billing_company_subscriptions", force: :cascade do |t|
    t.bigint "company_id", null: false, comment: "Empresa assinante"
    t.bigint "plan_id", null: false, comment: "Plano contratado (Free/Pro/Enterprise)"
    t.string "status", default: "incomplete", null: false, comment: "trialing|active|past_due|canceled|unpaid|incomplete|incomplete_expired|manual|paused|enterprise_lead"
    t.string "stripe_customer_id", comment: "Stripe Customer ID (cus_XXXX)"
    t.string "stripe_subscription_id", comment: "Stripe Subscription ID (sub_XXXX)"
    t.string "stripe_price_id", comment: "Stripe Price ID atual da subscription"
    t.datetime "current_period_start", comment: "Início do período atual (UTC)"
    t.datetime "current_period_end", comment: "Fim do período atual (UTC)"
    t.boolean "cancel_at_period_end", default: false, null: false, comment: "Cancelamento agendado para o fim do período"
    t.datetime "canceled_at", comment: "Timestamp do cancelamento efetivo"
    t.datetime "trial_start", comment: "Início do trial"
    t.datetime "trial_end", comment: "Fim do trial"
    t.text "last_payment_error", comment: "Motivo da última falha de pagamento (sem dados de cartão)"
    t.datetime "last_payment_error_at", comment: "Timestamp da última falha"
    t.datetime "last_synced_at", comment: "Último sync com Stripe"
    t.boolean "is_enterprise_manual", default: false, null: false, comment: "Conta Enterprise ativada manualmente (sem Stripe)"
    t.text "enterprise_notes", comment: "Notas do processo Enterprise (contrato, motivo, etc.)"
    t.text "admin_notes", comment: "Notas operacionais do admin (visível só internamente)"
    t.string "enterprise_lead_status", comment: "Status do lead Enterprise: new|contacted|qualified|converted|lost"
    t.jsonb "enterprise_lead_metadata", default: {}, comment: "Payload CRM-ready: tamanho da empresa, segmento, urgência, etc."
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["cancel_at_period_end"], name: "idx_billing_subs_cancel_at_period_end", where: "(cancel_at_period_end = true)"
    t.index ["company_id"], name: "idx_billing_subs_company_unique", unique: true
    t.index ["company_id"], name: "index_billing_company_subscriptions_on_company_id"
    t.index ["current_period_end"], name: "index_billing_company_subscriptions_on_current_period_end"
    t.index ["is_enterprise_manual"], name: "index_billing_company_subscriptions_on_is_enterprise_manual"
    t.index ["last_payment_error_at"], name: "idx_billing_subs_payment_failed", where: "(last_payment_error_at IS NOT NULL)"
    t.index ["plan_id"], name: "index_billing_company_subscriptions_on_plan_id"
    t.index ["status"], name: "index_billing_company_subscriptions_on_status"
    t.index ["stripe_customer_id"], name: "idx_billing_subs_stripe_customer_unique", unique: true, where: "(stripe_customer_id IS NOT NULL)"
    t.index ["stripe_subscription_id"], name: "idx_billing_subs_stripe_subscription_unique", unique: true, where: "(stripe_subscription_id IS NOT NULL)"
  end

  create_table "billing_stripe_events", force: :cascade do |t|
    t.string "stripe_event_id", null: false, comment: "ID do evento Stripe (evt_XXXX) — UNIQUE para idempotência"
    t.string "event_type", null: false, comment: "Tipo do evento (customer.subscription.created, etc.)"
    t.string "processing_status", default: "processing", null: false, comment: "processing|success|failed|skipped"
    t.text "error_message", comment: "Mensagem de erro se processing_status = failed"
    t.jsonb "raw_payload", default: {}, comment: "Payload do evento Stripe (filtrado para remover dados sensíveis)"
    t.datetime "processed_at", null: false, comment: "Quando o evento foi recebido para processamento"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["event_type"], name: "index_billing_stripe_events_on_event_type"
    t.index ["processed_at"], name: "index_billing_stripe_events_on_processed_at"
    t.index ["processing_status", "created_at"], name: "idx_billing_stripe_events_failed", where: "((processing_status)::text = 'failed'::text)"
    t.index ["processing_status"], name: "index_billing_stripe_events_on_processing_status"
    t.index ["stripe_event_id"], name: "idx_billing_stripe_events_unique", unique: true
  end

  create_table "brands", force: :cascade do |t|
    t.string "name", null: false
    t.string "slug", null: false
    t.jsonb "aliases", default: [], null: false
    t.string "status", default: "active", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["slug"], name: "index_brands_on_slug", unique: true
    t.index ["status"], name: "index_brands_on_status"
  end

  create_table "buyer_intent_activities", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.bigint "company_id", null: false
    t.bigint "user_id"
    t.string "anonymous_id"
    t.string "session_id", null: false
    t.string "signal_type", null: false
    t.string "signal_category", null: false
    t.integer "intent_weight", default: 1, null: false
    t.string "element_selector"
    t.string "element_type"
    t.string "page_path", null: false
    t.string "referrer_host"
    t.integer "duration_ms"
    t.jsonb "metadata", default: {}, null: false
    t.string "ip_hash"
    t.string "user_agent"
    t.string "device_type"
    t.datetime "tracked_at", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["anonymous_id", "tracked_at"], name: "idx_intent_anon_time", where: "(anonymous_id IS NOT NULL)"
    t.index ["anonymous_id"], name: "index_buyer_intent_activities_on_anonymous_id"
    t.index ["company_id", "signal_type", "tracked_at"], name: "idx_intent_company_signal_time"
    t.index ["company_id"], name: "index_buyer_intent_activities_on_company_id"
    t.index ["metadata"], name: "index_buyer_intent_activities_on_metadata", using: :gin
    t.index ["session_id"], name: "index_buyer_intent_activities_on_session_id"
    t.index ["signal_category"], name: "index_buyer_intent_activities_on_signal_category"
    t.index ["signal_type"], name: "index_buyer_intent_activities_on_signal_type"
    t.index ["tracked_at"], name: "index_buyer_intent_activities_on_tracked_at"
    t.index ["user_id"], name: "index_buyer_intent_activities_on_user_id"
  end

  create_table "campaign_reviews", force: :cascade do |t|
    t.bigint "product_id", null: false
    t.string "title"
    t.string "code"
    t.integer "member_id"
    t.string "share_code"
    t.integer "goal"
    t.integer "achieved"
    t.integer "debutants"
    t.integer "shares"
    t.string "prize"
    t.datetime "start_at"
    t.datetime "end_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.bigint "company_id"
    t.boolean "sponsored", default: false
    t.string "status", default: "draft"
    t.index ["company_id", "sponsored"], name: "index_campaign_reviews_on_company_sponsored"
    t.index ["company_id"], name: "index_campaign_reviews_on_company_id"
    t.index ["created_at"], name: "index_campaign_reviews_on_created_at"
    t.index ["id"], name: "index_campaign_reviews_on_sponsored_true", where: "(sponsored = true)"
    t.index ["product_id"], name: "index_campaign_reviews_on_product_id"
    t.index ["status"], name: "index_campaign_reviews_on_status"
    t.check_constraint "start_at IS NULL OR end_at IS NULL OR end_at >= start_at", name: "chk_campaign_reviews_period"
    t.check_constraint "status IS NULL OR (status::text = ANY (ARRAY['draft'::character varying, 'active'::character varying, 'finished'::character varying, 'canceled'::character varying]::text[]))", name: "campaign_reviews_status_allowed"
  end

  create_table "campaigns", force: :cascade do |t|
    t.string "name"
    t.text "description"
    t.date "start_date"
    t.date "end_date"
    t.decimal "budget"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.bigint "company_id"
    t.string "target_url"
    t.integer "priority", default: 0
    t.index ["company_id"], name: "index_campaigns_on_company_id"
  end

  create_table "categories", force: :cascade do |t|
    t.string "name"
    t.string "seo_url"
    t.string "seo_title"
    t.text "short_description"
    t.text "description"
    t.integer "parent_id"
    t.string "kind"
    t.string "status"
    t.boolean "featured", default: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.integer "companies_count", default: 0
    t.integer "products_count", default: 0
    t.decimal "average_rating", precision: 3, scale: 2, default: "0.0"
    t.decimal "average_price", precision: 10, scale: 2, default: "0.0"
    t.integer "views_count", default: 0
    t.json "permissions_config"
    t.string "seo_keywords"
    t.text "seo_description"
    t.index ["average_price"], name: "index_categories_on_average_price"
    t.index ["average_rating"], name: "index_categories_on_average_rating"
    t.index ["companies_count"], name: "index_categories_on_companies_count"
    t.index ["parent_id"], name: "index_categories_on_parent_id"
    t.index ["seo_url"], name: "index_categories_on_seo_url", unique: true
    t.index ["views_count"], name: "index_categories_on_views_count"
  end

  create_table "categories_companies", id: false, force: :cascade do |t|
    t.bigint "company_id", null: false
    t.bigint "category_id", null: false
    t.index ["category_id", "company_id"], name: "index_categories_companies_on_category_id_and_company_id"
    t.index ["company_id", "category_id"], name: "index_categories_companies_on_company_id_and_category_id"
  end

  create_table "categories_products", id: false, force: :cascade do |t|
    t.bigint "product_id", null: false
    t.bigint "category_id", null: false
    t.index ["category_id", "product_id"], name: "index_categories_products_on_category_id_and_product_id"
    t.index ["product_id", "category_id"], name: "index_categories_products_on_product_id_and_category_id"
  end

  create_table "category_faqs", force: :cascade do |t|
    t.bigint "category_id", null: false
    t.string "question", null: false
    t.text "answer", null: false
    t.integer "position", default: 0, null: false
    t.string "status", default: "published", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["category_id", "position"], name: "index_category_faqs_on_category_id_and_position"
    t.index ["category_id", "status"], name: "index_category_faqs_on_category_id_and_status"
    t.index ["category_id"], name: "index_category_faqs_on_category_id"
  end

  create_table "category_lead_wizards", force: :cascade do |t|
    t.bigint "category_id", null: false
    t.boolean "enabled", default: true, null: false
    t.string "template_key"
    t.integer "template_version", default: 1
    t.jsonb "schema", default: {}
    t.jsonb "thank_you_config", default: {}
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["category_id"], name: "index_category_lead_wizards_on_category_id", unique: true
  end

  create_table "category_solution_types", force: :cascade do |t|
    t.bigint "category_id", null: false
    t.string "name", null: false
    t.string "slug", null: false
    t.text "short_description"
    t.text "description"
    t.string "visual_key"
    t.string "technology_family"
    t.string "speed_class"
    t.integer "position", default: 100, null: false
    t.boolean "active", default: true, null: false
    t.boolean "featured", default: false, null: false
    t.jsonb "attributes_json", default: {}, null: false
    t.jsonb "use_cases", default: [], null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["category_id", "active", "position"], name: "idx_cst_category_active_pos"
    t.index ["category_id", "slug"], name: "idx_cst_category_slug", unique: true
    t.index ["category_id"], name: "idx_cst_category"
  end

  create_table "chat_insights", force: :cascade do |t|
    t.string "insight_type", null: false
    t.string "vertical"
    t.string "city"
    t.string "state"
    t.string "title", null: false
    t.text "summary"
    t.integer "volume", default: 1
    t.float "confidence_score"
    t.date "source_period_start"
    t.date "source_period_end"
    t.jsonb "metadata", default: {}
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["city"], name: "index_chat_insights_on_city"
    t.index ["created_at"], name: "index_chat_insights_on_created_at"
    t.index ["insight_type", "created_at"], name: "index_chat_insights_on_insight_type_and_created_at"
    t.index ["insight_type", "vertical"], name: "index_chat_insights_on_insight_type_and_vertical"
    t.index ["insight_type"], name: "index_chat_insights_on_insight_type"
    t.index ["state"], name: "index_chat_insights_on_state"
    t.index ["vertical"], name: "index_chat_insights_on_vertical"
  end

  create_table "chat_lead_activities", force: :cascade do |t|
    t.bigint "chat_lead_id", null: false
    t.string "activity_type", null: false
    t.text "description"
    t.string "old_status"
    t.string "new_status"
    t.bigint "performed_by_id"
    t.jsonb "metadata", default: {}
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["activity_type"], name: "index_chat_lead_activities_on_activity_type"
    t.index ["chat_lead_id"], name: "index_chat_lead_activities_on_chat_lead_id"
    t.index ["created_at"], name: "index_chat_lead_activities_on_created_at"
  end

  create_table "chat_leads", force: :cascade do |t|
    t.bigint "chat_session_id", null: false
    t.string "name"
    t.string "email"
    t.string "phone"
    t.string "city"
    t.string "state"
    t.string "vertical"
    t.string "intent"
    t.string "project_type"
    t.decimal "monthly_bill", precision: 10, scale: 2
    t.integer "vehicle_count"
    t.string "solution_type"
    t.string "budget_range"
    t.string "urgency"
    t.string "decision_timeline"
    t.string "decision_role"
    t.string "property_type"
    t.string "company_size"
    t.integer "lead_score", default: 0, null: false
    t.string "lead_temperature", default: "frio", null: false
    t.string "sales_status", default: "new", null: false
    t.bigint "assigned_to_id"
    t.bigint "assigned_company_id"
    t.boolean "consent_given", default: false, null: false
    t.datetime "consent_given_at"
    t.string "source_page"
    t.string "utm_source"
    t.string "utm_medium"
    t.string "utm_campaign"
    t.text "summary"
    t.jsonb "pain_points", default: []
    t.jsonb "objections", default: []
    t.string "recommended_next_action"
    t.jsonb "metadata", default: {}
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.integer "intent_score", default: 0
    t.integer "fit_score", default: 0
    t.jsonb "score_explanation", default: {}
    t.string "assignment_source"
    t.index ["assignment_source"], name: "index_chat_leads_on_assignment_source"
    t.index ["chat_session_id"], name: "index_chat_leads_on_chat_session_id", unique: true, where: "(chat_session_id IS NOT NULL)"
    t.index ["city"], name: "index_chat_leads_on_city"
    t.index ["consent_given"], name: "index_chat_leads_on_consent_given"
    t.index ["created_at"], name: "index_chat_leads_on_created_at"
    t.index ["intent"], name: "index_chat_leads_on_intent"
    t.index ["lead_score"], name: "index_chat_leads_on_lead_score"
    t.index ["lead_temperature", "created_at"], name: "index_chat_leads_on_lead_temperature_and_created_at"
    t.index ["lead_temperature"], name: "index_chat_leads_on_lead_temperature"
    t.index ["sales_status", "created_at"], name: "index_chat_leads_on_sales_status_and_created_at"
    t.index ["sales_status"], name: "index_chat_leads_on_sales_status"
    t.index ["source_page"], name: "index_chat_leads_on_source_page"
    t.index ["state"], name: "index_chat_leads_on_state"
    t.index ["utm_campaign"], name: "index_chat_leads_on_utm_campaign"
    t.index ["utm_source"], name: "index_chat_leads_on_utm_source"
    t.index ["vertical", "created_at"], name: "index_chat_leads_on_vertical_and_created_at"
    t.index ["vertical"], name: "index_chat_leads_on_vertical"
  end

  create_table "chat_messages", force: :cascade do |t|
    t.bigint "chat_session_id", null: false
    t.string "role", null: false
    t.text "content", null: false
    t.string "model"
    t.integer "token_count"
    t.integer "latency_ms"
    t.string "safety_status", default: "clean"
    t.string "intent_detected"
    t.integer "feedback"
    t.jsonb "metadata", default: {}
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.bigint "sender_id"
    t.string "client_message_id"
    t.index ["chat_session_id", "client_message_id"], name: "index_chat_messages_idempotency", unique: true, where: "(client_message_id IS NOT NULL)"
    t.index ["chat_session_id", "created_at"], name: "index_chat_messages_on_chat_session_id_and_created_at"
    t.index ["chat_session_id"], name: "index_chat_messages_on_chat_session_id"
    t.index ["created_at"], name: "index_chat_messages_on_created_at"
    t.index ["intent_detected"], name: "index_chat_messages_on_intent_detected"
    t.index ["role"], name: "index_chat_messages_on_role"
    t.index ["safety_status"], name: "index_chat_messages_on_safety_status"
    t.index ["sender_id"], name: "index_chat_messages_on_sender_id"
  end

  create_table "chat_sessions", force: :cascade do |t|
    t.string "visitor_id", null: false
    t.bigint "user_id"
    t.string "page_url"
    t.string "source_page"
    t.string "referrer"
    t.string "utm_source"
    t.string "utm_medium"
    t.string "utm_campaign"
    t.string "utm_term"
    t.string "utm_content"
    t.string "vertical"
    t.string "status", default: "active", null: false
    t.datetime "started_at", null: false
    t.datetime "ended_at"
    t.datetime "last_message_at"
    t.integer "message_count", default: 0, null: false
    t.jsonb "metadata", default: {}
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.bigint "company_id"
    t.bigint "assigned_agent_id"
    t.string "mode", default: "bot_only", null: false
    t.string "inbox_status", default: "active", null: false
    t.integer "company_unread_count", default: 0, null: false
    t.datetime "human_requested_at"
    t.datetime "human_taken_over_at"
    t.datetime "last_customer_message_at"
    t.datetime "last_agent_message_at"
    t.datetime "archived_at"
    t.integer "lock_version", default: 0, null: false
    t.string "visitor_nonce"
    t.integer "access_token_version", default: 1, null: false
    t.index ["assigned_agent_id"], name: "index_chat_sessions_on_assigned_agent_id"
    t.index ["company_id", "company_unread_count"], name: "index_chat_sessions_company_unread"
    t.index ["company_id", "inbox_status", "last_message_at"], name: "index_chat_sessions_live_inbox"
    t.index ["company_id"], name: "index_chat_sessions_on_company_id"
    t.index ["created_at"], name: "index_chat_sessions_on_created_at"
    t.index ["source_page"], name: "index_chat_sessions_on_source_page"
    t.index ["status"], name: "index_chat_sessions_on_status"
    t.index ["user_id"], name: "index_chat_sessions_on_user_id"
    t.index ["utm_campaign"], name: "index_chat_sessions_on_utm_campaign"
    t.index ["utm_source"], name: "index_chat_sessions_on_utm_source"
    t.index ["vertical"], name: "index_chat_sessions_on_vertical"
    t.index ["visitor_id", "created_at"], name: "index_chat_sessions_on_visitor_id_and_created_at"
    t.index ["visitor_id"], name: "index_chat_sessions_on_visitor_id"
    t.index ["visitor_nonce"], name: "index_chat_sessions_on_visitor_nonce", unique: true
  end

  create_table "classified_topics", force: :cascade do |t|
    t.string "source_type", limit: 50
    t.bigint "source_id"
    t.string "vertical", limit: 20
    t.string "category"
    t.string "city"
    t.string "state"
    t.string "audience", limit: 20
    t.string "funnel_stage", limit: 20
    t.string "topic"
    t.string "sentiment", limit: 20
    t.string "urgency", limit: 20
    t.decimal "relevance_score", precision: 3, scale: 2
    t.decimal "lead_potential", precision: 3, scale: 2
    t.boolean "content_worthy", default: false
    t.jsonb "content_angles"
    t.boolean "ready_for_content", default: false
    t.datetime "processed_at"
    t.datetime "created_at", null: false
    t.index ["ready_for_content"], name: "index_classified_topics_on_ready_for_content", where: "(ready_for_content = true)"
    t.index ["urgency"], name: "index_classified_topics_on_urgency"
  end

  create_table "comments", force: :cascade do |t|
    t.bigint "post_id"
    t.bigint "user_id", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "commentable_type"
    t.bigint "commentable_id"
    t.bigint "parent_id"
    t.text "body"
    t.string "status", default: "active", null: false
    t.datetime "edited_at"
    t.datetime "deleted_at"
    t.index ["commentable_type", "commentable_id"], name: "index_comments_on_commentable"
    t.index ["parent_id"], name: "index_comments_on_parent_id"
    t.index ["post_id"], name: "index_comments_on_post_id"
    t.index ["status"], name: "index_comments_on_status"
    t.index ["user_id"], name: "index_comments_on_user_id"
  end

  create_table "companies", force: :cascade do |t|
    t.string "name", null: false
    t.text "description"
    t.string "website"
    t.string "phone"
    t.text "address"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "phone_alt"
    t.string "whatsapp"
    t.string "email_public"
    t.boolean "featured", default: false
    t.boolean "verified", default: false
    t.integer "reviews_count", default: 0
    t.string "cnpj"
    t.string "email"
    t.string "instagram"
    t.string "facebook"
    t.string "linkedin"
    t.string "working_hours"
    t.string "payment_methods"
    t.string "status", default: "active"
    t.text "certifications"
    t.string "cta_primary_label"
    t.string "cta_primary_type"
    t.string "cta_primary_url"
    t.string "cta_secondary_label"
    t.string "cta_secondary_type"
    t.string "cta_secondary_url"
    t.text "cta_whatsapp_template"
    t.string "cta_utm_source"
    t.string "cta_utm_medium"
    t.string "cta_utm_campaign"
    t.jsonb "ctas_json", default: {}
    t.integer "founded_year"
    t.integer "employees_count"
    t.decimal "rating_avg", precision: 3, scale: 2, default: "0.0"
    t.integer "rating_count", default: 0
    t.text "awards"
    t.text "partner_brands"
    t.text "coverage_states"
    t.text "coverage_cities"
    t.decimal "latitude", precision: 10, scale: 6
    t.decimal "longitude", precision: 10, scale: 6
    t.integer "minimum_ticket"
    t.integer "maximum_ticket"
    t.text "financing_options"
    t.string "response_time_sla"
    t.text "languages"
    t.string "state"
    t.string "city"
    t.jsonb "social_media", default: {}
    t.boolean "email_notifications_enabled", default: true, null: false
    t.datetime "last_digest_sent_at"
    t.jsonb "notification_preferences", default: {}
    t.jsonb "project_types", default: [], null: false
    t.jsonb "services_offered", default: [], null: false
    t.jsonb "whatsapp_button_style_json", default: {}, null: false
    t.boolean "cta_whatsapp_enabled", default: false, null: false
    t.string "cta_whatsapp_url"
    t.bigint "plan_id"
    t.string "plan_status", default: "inactive"
    t.string "whatsapp_url"
    t.boolean "whatsapp_enabled"
    t.boolean "effect", default: false, null: false
    t.integer "profile_views_count", default: 0, null: false
    t.integer "cta_clicks_count", default: 0, null: false
    t.integer "whatsapp_clicks_count", default: 0, null: false
    t.string "moderation_status"
    t.datetime "submitted_at"
    t.datetime "approved_at"
    t.integer "approved_by_admin_user_id"
    t.text "rejected_reason"
    t.boolean "financing_enabled", default: false, null: false
    t.string "slug", null: false
    t.boolean "active_admin", default: false, null: false
    t.boolean "financing_tab_visible", default: false, null: false
    t.boolean "social_proof_enabled", default: false, null: false
    t.decimal "sector_rating_avg", precision: 4, scale: 2, default: "0.0", null: false
    t.integer "sector_rating_count", default: 0, null: false
    t.boolean "sector_ratings_enabled", default: false, null: false
    t.string "api_key"
    t.decimal "trust_score"
    t.integer "priority_score", default: 0, null: false
    t.boolean "sponsored", default: false, null: false
    t.jsonb "niche_tags", default: [], null: false
    t.integer "financing_partners_count", default: 0
    t.integer "company_members_count", default: 0
    t.integer "leads_count", default: 0
    t.string "ga4_property_id"
    t.datetime "ga4_last_sync"
    t.jsonb "engagement_metrics", default: {}
    t.string "intent_tier", default: "free", null: false
    t.jsonb "intent_features", default: {}
    t.string "seo_title"
    t.text "meta_description"
    t.string "segment", default: "installer", null: false
    t.integer "installation_warranty_years", default: 1
    t.jsonb "equipment_brands", default: []
    t.boolean "engineering_insurance", default: false
    t.jsonb "post_sales_capacity", default: []
    t.integer "delivered_projects_score", default: 0
    t.integer "warranty_years"
    t.boolean "post_sales_support"
    t.datetime "geocoded_at"
    t.string "geocoding_status", default: "pending"
    t.boolean "p2p_chat_enabled", default: false, null: false
    t.string "business_verification_status", default: "unverified", null: false
    t.datetime "business_verified_at"
    t.string "business_verification_method"
    t.integer "delivered_projects_count", default: 0, null: false
    t.integer "response_sla_minutes"
    t.datetime "operational_data_updated_at"
    t.text "seo_description"
    t.string "seo_keywords"
    t.index "to_tsvector('portuguese'::regconfig, (((((((COALESCE(name, ''::character varying))::text || ' '::text) || COALESCE(description, ''::text)) || ' '::text) || (COALESCE(city, ''::character varying))::text) || ' '::text) || (COALESCE(state, ''::character varying))::text))", name: "index_companies_on_full_text_search", using: :gin
    t.index ["api_key"], name: "index_companies_on_api_key"
    t.index ["cnpj"], name: "index_companies_on_cnpj", unique: true, where: "(cnpj IS NOT NULL)"
    t.index ["created_at"], name: "index_companies_on_created_at"
    t.index ["cta_clicks_count"], name: "index_companies_on_cta_clicks_count"
    t.index ["cta_whatsapp_enabled"], name: "index_companies_on_cta_whatsapp_enabled"
    t.index ["effect"], name: "index_companies_on_effect"
    t.index ["email_notifications_enabled"], name: "index_companies_on_email_notifications_enabled"
    t.index ["featured"], name: "index_companies_on_featured_true", where: "(featured = true)"
    t.index ["financing_partners_count"], name: "index_companies_on_financing_partners_count"
    t.index ["ga4_property_id"], name: "index_companies_on_ga4_property_id", where: "(ga4_property_id IS NOT NULL)"
    t.index ["geocoding_status"], name: "index_companies_on_geocoding_status"
    t.index ["intent_tier"], name: "index_companies_on_intent_tier"
    t.index ["latitude", "longitude"], name: "index_companies_on_lat_lng", where: "((latitude IS NOT NULL) AND (longitude IS NOT NULL))"
    t.index ["leads_count"], name: "index_companies_on_leads_count"
    t.index ["niche_tags"], name: "index_companies_on_niche_tags", using: :gin
    t.index ["notification_preferences"], name: "index_companies_on_notification_preferences", using: :gin
    t.index ["plan_id"], name: "index_companies_on_plan_id"
    t.index ["plan_status"], name: "index_companies_on_plan_status"
    t.index ["priority_score"], name: "index_companies_on_priority_score"
    t.index ["profile_views_count"], name: "index_companies_on_profile_views_count"
    t.index ["project_types"], name: "index_companies_on_project_types_gin", using: :gin
    t.index ["reviews_count"], name: "index_companies_on_reviews_count"
    t.index ["sector_rating_avg"], name: "index_companies_on_sector_rating_avg", where: "(sector_rating_avg IS NOT NULL)"
    t.index ["segment"], name: "index_companies_on_segment"
    t.index ["seo_title"], name: "index_companies_on_seo_title"
    t.index ["services_offered"], name: "index_companies_on_services_offered", using: :gin
    t.index ["slug"], name: "index_companies_on_slug", unique: true
    t.index ["social_proof_enabled"], name: "index_companies_on_social_proof_enabled"
    t.index ["sponsored"], name: "index_companies_on_sponsored"
    t.index ["state", "city", "rating_avg"], name: "idx_companies_geo_rating"
    t.index ["state", "city"], name: "index_companies_on_state_and_city"
    t.index ["status", "active_admin"], name: "index_companies_on_status_and_active_admin"
    t.index ["status", "rating_avg", "reviews_count"], name: "idx_companies_ranking", order: { rating_avg: :desc, reviews_count: :desc }
    t.index ["status"], name: "index_companies_on_status"
    t.index ["verified"], name: "index_companies_on_verified_true", where: "(verified = true)"
    t.index ["whatsapp_clicks_count"], name: "index_companies_on_whatsapp_clicks_count"
    t.check_constraint "cnpj IS NULL OR length(cnpj::text) = 14 AND cnpj::text ~ '^[0-9]+$'::text", name: "ck_companies_valid_cnpj"
    t.check_constraint "email IS NULL OR email::text ~ '^[^@]+@[^@]+\\.[^@]+$'::text", name: "ck_companies_valid_email"
    t.check_constraint "status::text = ANY (ARRAY['active'::character varying, 'inactive'::character varying, 'pending'::character varying, 'blocked'::character varying]::text[])", name: "companies_status_allowed"
  end

