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

ActiveRecord::Schema[7.0].define(version: 2026_06_16_023840) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "btree_gin"
  enable_extension "pgcrypto"
  enable_extension "plpgsql"

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

  create_table "banner_daily_stats", force: :cascade do |t|
    t.bigint "banner_id", null: false
    t.date "day", null: false
    t.integer "views_count", default: 0, null: false
    t.integer "clicks_count", default: 0, null: false
    t.decimal "ctr", default: "0.0", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
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
    t.index ["banner_id", "event_type", "tracked_at"], name: "idx_banner_events_analytics", order: { tracked_at: :desc }
    t.index ["banner_id"], name: "index_banner_events_on_banner_id"
    t.index ["company_id"], name: "index_banner_events_on_company_id"
    t.index ["event_type"], name: "index_banner_events_on_event_type"
    t.index ["tracked_at"], name: "index_banner_events_on_tracked_at"
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
    t.index ["active", "moderation_status", "position"], name: "idx_banners_active_approved", where: "((active = true) AND ((moderation_status)::text = 'approved'::text))"
    t.index ["approved_by_admin_user_id"], name: "index_banners_on_approved_by_admin_user_id"
    t.index ["category_id"], name: "index_banners_on_category_id"
    t.index ["company_id"], name: "index_banners_on_company_id"
    t.index ["end_date"], name: "index_banners_on_end_date"
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
    t.index ["banner_id", "category_id"], name: "idx_banners_categories_unique", unique: true
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
    t.index ["chat_session_id", "created_at"], name: "index_chat_messages_on_chat_session_id_and_created_at"
    t.index ["chat_session_id"], name: "index_chat_messages_on_chat_session_id"
    t.index ["created_at"], name: "index_chat_messages_on_created_at"
    t.index ["intent_detected"], name: "index_chat_messages_on_intent_detected"
    t.index ["role"], name: "index_chat_messages_on_role"
    t.index ["safety_status"], name: "index_chat_messages_on_safety_status"
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
    t.index ["created_at"], name: "index_chat_sessions_on_created_at"
    t.index ["source_page"], name: "index_chat_sessions_on_source_page"
    t.index ["status"], name: "index_chat_sessions_on_status"
    t.index ["user_id"], name: "index_chat_sessions_on_user_id"
    t.index ["utm_campaign"], name: "index_chat_sessions_on_utm_campaign"
    t.index ["utm_source"], name: "index_chat_sessions_on_utm_source"
    t.index ["vertical"], name: "index_chat_sessions_on_vertical"
    t.index ["visitor_id", "created_at"], name: "index_chat_sessions_on_visitor_id_and_created_at"
    t.index ["visitor_id"], name: "index_chat_sessions_on_visitor_id"
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
    t.bigint "post_id", null: false
    t.bigint "user_id", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["post_id"], name: "index_comments_on_post_id"
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
    t.index ["services_offered"], name: "index_companies_on_services_offered_gin", using: :gin
    t.index ["slug"], name: "index_companies_on_slug", unique: true
    t.index ["social_proof_enabled"], name: "index_companies_on_social_proof_enabled"
    t.index ["sponsored"], name: "index_companies_on_sponsored"
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

  create_table "company_access_requests", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.bigint "company_id", null: false
    t.string "status", default: "pending", null: false
    t.text "message"
    t.text "admin_note"
    t.datetime "requested_at", default: -> { "CURRENT_TIMESTAMP" }, null: false
    t.datetime "reviewed_at"
    t.bigint "reviewed_by_admin_user_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["company_id"], name: "index_company_access_requests_on_company_id"
    t.index ["reviewed_by_admin_user_id"], name: "index_company_access_requests_on_reviewed_by_admin_user_id"
    t.index ["status"], name: "index_company_access_requests_on_status"
    t.index ["user_id", "company_id"], name: "index_company_access_requests_on_user_company_active", unique: true, where: "((status)::text = ANY ((ARRAY['pending'::character varying, 'approved'::character varying])::text[]))"
    t.index ["user_id"], name: "index_company_access_requests_on_user_id"
  end

  create_table "company_anomaly_daily", primary_key: ["company_id", "day", "metric"], force: :cascade do |t|
    t.bigint "company_id", null: false
    t.date "day", null: false
    t.text "metric", null: false
    t.decimal "zscore", precision: 8, scale: 4, null: false
    t.boolean "flagged", null: false
    t.datetime "created_at", default: -> { "now()" }, null: false
    t.datetime "updated_at", default: -> { "now()" }, null: false
    t.index ["company_id", "flagged"], name: "index_company_anomaly_daily_on_company_id_and_flagged"
  end

  create_table "company_badges", force: :cascade do |t|
    t.bigint "company_id", null: false
    t.bigint "badge_id", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["badge_id"], name: "index_company_badges_on_badge_id"
    t.index ["company_id", "badge_id"], name: "index_company_badges_on_company_id_and_badge_id", unique: true
    t.index ["company_id"], name: "index_company_badges_on_company_id"
  end

  create_table "company_buttons", force: :cascade do |t|
    t.bigint "company_id", null: false
    t.string "label"
    t.string "url"
    t.boolean "active", default: true
    t.integer "position"
    t.string "button_type"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["company_id"], name: "index_company_buttons_on_company_id"
  end

  create_table "company_daily_stats", force: :cascade do |t|
    t.integer "company_id", null: false
    t.date "day", null: false
    t.integer "profile_views", default: 0, null: false
    t.integer "cta_clicks", default: 0, null: false
    t.integer "whatsapp_clicks", default: 0, null: false
    t.integer "leads", default: 0, null: false
    t.integer "reviews", default: 0, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.integer "email_clicks", default: 0, null: false
    t.integer "phone_clicks", default: 0, null: false
    t.integer "website_clicks", default: 0, null: false
    t.integer "unique_views", default: 0, null: false
    t.integer "returning_views", default: 0, null: false
    t.index ["company_id", "day"], name: "index_company_daily_stats_on_company_id_and_day", unique: true
    t.index ["day"], name: "index_company_daily_stats_on_day"
  end

  create_table "company_documents", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
  end

  create_table "company_faqs", force: :cascade do |t|
    t.bigint "company_id", null: false
    t.string "question", null: false
    t.text "answer", null: false
    t.integer "position", default: 0, null: false
    t.string "status", default: "published", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["company_id", "position"], name: "index_company_faqs_on_company_id_and_position"
    t.index ["company_id", "status"], name: "index_company_faqs_on_company_id_and_status"
    t.index ["company_id"], name: "index_company_faqs_on_company_id"
  end

  create_table "company_feature_daily", primary_key: ["company_id", "day"], force: :cascade do |t|
    t.bigint "company_id", null: false
    t.date "day", null: false
    t.decimal "engagement_score", precision: 10, scale: 4, default: "0.0"
    t.decimal "lead_conversion_rate", precision: 5, scale: 4, default: "0.0"
    t.integer "review_velocity", default: 0
    t.decimal "unique_session_ratio", precision: 5, scale: 4, default: "0.0"
    t.datetime "updated_at", default: -> { "now()" }, null: false
    t.datetime "created_at", default: -> { "now()" }, null: false
  end

  create_table "company_feature_rolling_30d", primary_key: "company_id", force: :cascade do |t|
    t.datetime "computed_at", default: -> { "now()" }, null: false
    t.decimal "avg_engagement", precision: 10, scale: 4, default: "0.0"
    t.integer "total_leads", default: 0
    t.integer "total_views", default: 0
    t.decimal "conversion_trend", precision: 10, scale: 4, default: "0.0"
    t.datetime "created_at", default: -> { "now()" }, null: false
    t.datetime "updated_at", default: -> { "now()" }, null: false
  end

  create_table "company_financing_offers", force: :cascade do |t|
    t.bigint "company_id", null: false
    t.string "name", null: false
    t.string "offer_type"
    t.integer "term_months"
    t.decimal "interest_rate_monthly", precision: 8, scale: 4
    t.decimal "min_down_payment_percent", precision: 5, scale: 2
    t.integer "grace_months"
    t.string "amortization_type"
    t.text "notes"
    t.boolean "active", default: true, null: false
    t.integer "position", default: 0, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["company_id", "active"], name: "index_company_financing_offers_on_company_id_and_active"
    t.index ["company_id", "position"], name: "index_company_financing_offers_on_company_id_and_position"
    t.index ["company_id"], name: "index_company_financing_offers_on_company_id"
  end

  create_table "company_financing_partners", force: :cascade do |t|
    t.bigint "company_id", null: false
    t.string "name", null: false
    t.string "partner_type"
    t.string "website"
    t.integer "priority", default: 0, null: false
    t.integer "position", default: 0, null: false
    t.boolean "active", default: true, null: false
    t.string "badge"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["company_id", "position"], name: "index_company_financing_partners_on_company_id_and_position"
    t.index ["company_id", "priority"], name: "index_company_financing_partners_on_company_id_and_priority"
    t.index ["company_id"], name: "index_company_financing_partners_on_company_id"
  end

  create_table "company_financing_profiles", force: :cascade do |t|
    t.bigint "company_id", null: false
    t.string "title"
    t.string "subtitle"
    t.text "disclaimer"
    t.string "cta_label"
    t.string "cta_url"
    t.string "currency", default: "BRL"
    t.integer "default_amount_cents"
    t.integer "min_amount_cents"
    t.integer "max_amount_cents"
    t.decimal "default_down_payment_percent", precision: 5, scale: 2
    t.decimal "min_down_payment_percent", precision: 5, scale: 2
    t.decimal "max_down_payment_percent", precision: 5, scale: 2
    t.integer "default_term_months"
    t.integer "min_term_months"
    t.integer "max_term_months"
    t.decimal "default_interest_rate_monthly", precision: 8, scale: 4
    t.decimal "min_interest_rate_monthly", precision: 8, scale: 4
    t.decimal "max_interest_rate_monthly", precision: 8, scale: 4
    t.boolean "grace_months_enabled", default: false, null: false
    t.integer "max_grace_months"
    t.string "amortization_type", default: "price"
    t.boolean "show_bank_logos", default: true, null: false
    t.boolean "show_fee_inputs", default: false, null: false
    t.string "status", default: "draft", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["company_id"], name: "index_company_financing_profiles_on_company_id", unique: true
  end

  create_table "company_members", force: :cascade do |t|
    t.bigint "company_id", null: false
    t.bigint "user_id", null: false
    t.integer "role", default: 2, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "status", default: "active", null: false
    t.index ["company_id", "user_id"], name: "index_company_members_on_company_id_and_user_id", unique: true
    t.index ["company_id"], name: "index_company_members_on_company_id"
    t.index ["status"], name: "index_company_members_on_status"
    t.index ["user_id"], name: "index_company_members_on_user_id"
  end

  create_table "company_ranking_score", primary_key: "company_id", force: :cascade do |t|
    t.decimal "score", precision: 10, scale: 4, null: false
    t.datetime "computed_at", default: -> { "now()" }, null: false
    t.jsonb "breakdown", default: "{}", null: false
    t.datetime "created_at", default: -> { "now()" }, null: false
    t.datetime "updated_at", default: -> { "now()" }, null: false
    t.index ["score"], name: "index_company_ranking_score_on_score", order: :desc
  end

  create_table "company_sector_questions", force: :cascade do |t|
    t.bigint "company_id", null: false
    t.string "prompt", null: false
    t.integer "weight", default: 1, null: false
    t.integer "order", default: 0, null: false
    t.boolean "enabled", default: true, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["company_id", "order"], name: "index_company_sector_questions_on_company_and_order", unique: true
    t.index ["company_id"], name: "index_company_sector_questions_on_company_id"
  end

  create_table "company_trust_score", primary_key: "company_id", force: :cascade do |t|
    t.decimal "score", precision: 5, scale: 2, null: false
    t.jsonb "components", null: false
    t.datetime "computed_at", default: -> { "now()" }, null: false
    t.datetime "created_at", default: -> { "now()" }, null: false
    t.datetime "updated_at", default: -> { "now()" }, null: false
    t.index ["score"], name: "index_company_trust_score_on_score", order: :desc
    t.check_constraint "score >= 0::numeric AND score <= 100::numeric", name: "check_trust_score"
  end

  create_table "company_utm_attributions", force: :cascade do |t|
    t.bigint "company_id", null: false
    t.string "utm_source", limit: 100
    t.string "utm_medium", limit: 100
    t.string "utm_campaign", limit: 200
    t.string "utm_content", limit: 200
    t.string "utm_term", limit: 200
    t.integer "total_visits", default: 0, null: false
    t.integer "total_cta_clicks", default: 0, null: false
    t.integer "total_leads", default: 0, null: false
    t.decimal "conversion_rate", precision: 5, scale: 2, default: "0.0"
    t.integer "whatsapp_clicks", default: 0, null: false
    t.integer "email_clicks", default: 0, null: false
    t.integer "phone_clicks", default: 0, null: false
    t.integer "website_clicks", default: 0, null: false
    t.decimal "attributed_revenue", precision: 10, scale: 2, default: "0.0"
    t.date "first_seen_at"
    t.date "last_seen_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["company_id", "utm_source", "utm_medium", "utm_campaign"], name: "index_utm_attributions_on_company_and_params", unique: true
    t.index ["company_id"], name: "index_company_utm_attributions_on_company_id"
    t.index ["last_seen_at"], name: "index_utm_attributions_on_last_seen"
    t.index ["utm_campaign", "total_leads"], name: "index_utm_attributions_on_campaign_leads"
  end

  create_table "company_videos", force: :cascade do |t|
    t.bigint "company_id", null: false
    t.string "url", null: false
    t.string "provider", default: "youtube", null: false
    t.string "video_id", null: false
    t.string "title"
    t.string "thumbnail_url"
    t.string "status", default: "pending", null: false
    t.integer "position"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["company_id", "status"], name: "index_company_videos_on_company_id_and_status"
    t.index ["company_id"], name: "index_company_videos_on_company_id"
    t.index ["video_id"], name: "index_company_videos_on_video_id"
  end

  create_table "company_webhooks", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.bigint "company_id", null: false
    t.string "url", null: false
    t.string "secret_key"
    t.boolean "active", default: true
    t.jsonb "events", default: []
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["company_id", "active"], name: "index_company_webhooks_on_company_id_and_active"
    t.index ["company_id"], name: "index_company_webhooks_on_company_id"
  end

  create_table "consent_logs", force: :cascade do |t|
    t.bigint "user_id"
    t.string "session_id", null: false
    t.string "consent_type", null: false
    t.boolean "consent_given", null: false
    t.string "policy_version", default: "v1.0", null: false
    t.string "consent_method", null: false
    t.inet "ip_address"
    t.text "user_agent"
    t.text "page_url"
    t.text "referrer"
    t.jsonb "metadata", default: {}
    t.datetime "consented_at", precision: nil, default: -> { "CURRENT_TIMESTAMP" }, null: false
    t.datetime "expires_at", precision: nil
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["expires_at"], name: "index_consent_logs_on_expires_at", where: "(expires_at IS NOT NULL)"
    t.index ["policy_version"], name: "index_consent_logs_on_policy_version"
    t.index ["session_id", "consented_at"], name: "index_consent_logs_on_session_id_and_consented_at", order: { consented_at: :desc }
    t.index ["user_id", "consented_at"], name: "index_consent_logs_on_user_id_and_consented_at", order: { consented_at: :desc }
    t.index ["user_id"], name: "index_consent_logs_on_user_id"
    t.check_constraint "consent_type::text = ANY (ARRAY['analytics'::character varying, 'marketing'::character varying, 'functional'::character varying, 'all'::character varying, 'none'::character varying]::text[])", name: "consent_logs_type_check"
  end

  create_table "content", force: :cascade do |t|
    t.string "campaign_id"
    t.bigint "topic_id"
    t.string "source", limit: 20
    t.string "content_type", limit: 50
    t.string "vertical", limit: 20
    t.string "audience", limit: 20
    t.string "city"
    t.string "status", limit: 20
    t.jsonb "content_pack"
    t.jsonb "publish_urls"
    t.datetime "scheduled_for"
    t.datetime "published_at"
    t.jsonb "performance"
    t.string "created_by", limit: 100
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["campaign_id"], name: "index_content_on_campaign_id", unique: true
    t.index ["status", "scheduled_for"], name: "index_content_on_status_and_scheduled_for", where: "((status)::text = 'scheduled'::text)"
    t.index ["status"], name: "index_content_on_status"
  end

  create_table "content_templates", force: :cascade do |t|
    t.string "vertical", limit: 20
    t.string "audience", limit: 20
    t.string "content_type", limit: 50
    t.string "template_key", limit: 100
    t.text "template_text"
    t.decimal "weight", precision: 5, scale: 2, default: "1.0"
    t.integer "impressions", default: 0
    t.integer "conversions", default: 0
    t.decimal "conversion_rate", precision: 5, scale: 4
    t.datetime "last_updated_at"
    t.datetime "created_at", null: false
    t.index ["vertical", "audience", "template_key"], name: "idx_content_tmpl_lookup"
  end

  create_table "contents", force: :cascade do |t|
    t.string "title"
    t.text "short_description"
    t.string "tags"
    t.string "landing_url"
    t.string "format"
    t.string "level"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
  end

  create_table "conversations", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.bigint "company_id", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["company_id"], name: "index_conversations_on_company_id"
    t.index ["user_id"], name: "index_conversations_on_user_id"
  end

  create_table "daily_growth_snapshots", force: :cascade do |t|
    t.date "snapshot_date", null: false
    t.integer "total_page_views", default: 0
    t.integer "total_sessions", default: 0
    t.integer "roi_expands", default: 0
    t.integer "wizard_starts", default: 0
    t.integer "wizard_completions", default: 0
    t.integer "whatsapp_clicks", default: 0
    t.integer "compare_views", default: 0
    t.integer "leads_created", default: 0
    t.decimal "view_to_wizard_rate", precision: 5, scale: 4
    t.decimal "wizard_to_complete_rate", precision: 5, scale: 4
    t.decimal "wizard_to_lead_rate", precision: 5, scale: 4
    t.integer "solar_events", default: 0
    t.integer "ev_events", default: 0
    t.integer "b2b_events", default: 0
    t.integer "b2c_events", default: 0
    t.jsonb "top_cities"
    t.jsonb "top_campaigns"
    t.jsonb "top_content"
    t.integer "linkedin_followers", default: 0
    t.integer "instagram_followers", default: 0
    t.integer "x_followers", default: 0
    t.jsonb "metadata"
    t.datetime "created_at", null: false
    t.index ["snapshot_date"], name: "index_daily_growth_snapshots_on_snapshot_date", unique: true
  end

  create_table "demand_notifications", force: :cascade do |t|
    t.bigint "lead_id"
    t.bigint "intent_signal_id"
    t.string "notification_type", limit: 50
    t.string "channel", limit: 20
    t.string "status", limit: 20
    t.string "sla_window", limit: 20
    t.datetime "sla_expires_at"
    t.datetime "responded_at"
    t.datetime "created_at", null: false
    t.index ["lead_id"], name: "index_demand_notifications_on_lead_id"
    t.index ["status"], name: "index_demand_notifications_on_status"
  end

  create_table "direct_messages", force: :cascade do |t|
    t.bigint "conversation_id", null: false
    t.text "body"
    t.string "sender_type"
    t.datetime "read_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["conversation_id"], name: "index_direct_messages_on_conversation_id"
  end

  create_table "downloadables", force: :cascade do |t|
    t.string "title"
    t.text "description"
    t.string "file_url"
    t.integer "download_count"
    t.integer "article_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
  end

  create_table "event_definitions", primary_key: "event_type", id: :text, force: :cascade do |t|
    t.integer "schema_version", default: 1, null: false
    t.jsonb "required_keys", default: "[]", null: false
    t.jsonb "pii_keys", default: "[]", null: false
    t.jsonb "retention_policy", default: "{\"months\": 24}", null: false
    t.boolean "enabled", default: true, null: false
    t.text "description"
    t.datetime "created_at", default: -> { "now()" }, null: false
    t.datetime "updated_at", default: -> { "now()" }, null: false
  end

  create_table "event_ingest_errors", force: :cascade do |t|
    t.text "event_id"
    t.text "event_type"
    t.jsonb "payload"
    t.text "error_reason"
    t.datetime "occurred_at", default: -> { "now()" }, null: false
    t.datetime "created_at", default: -> { "now()" }, null: false
    t.datetime "updated_at", default: -> { "now()" }, null: false
    t.index ["event_type"], name: "index_event_ingest_errors_on_event_type"
    t.index ["occurred_at"], name: "index_event_ingest_errors_on_occurred_at"
  end

  create_table "external_tariffs_caches", force: :cascade do |t|
    t.string "cep_prefix"
    t.string "distributor"
    t.decimal "tariff_kwh", precision: 10, scale: 6
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["cep_prefix"], name: "index_external_tariffs_caches_on_cep_prefix"
  end

  create_table "faqs", force: :cascade do |t|
    t.string "question", null: false
    t.text "answer", null: false
    t.string "category", default: "geral", null: false
    t.integer "position", default: 0, null: false
    t.boolean "active", default: true, null: false
    t.integer "helpful_yes", default: 0, null: false
    t.integer "helpful_no", default: 0, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["active"], name: "index_faqs_on_active"
    t.index ["category", "active"], name: "index_faqs_on_category_and_active"
    t.index ["category"], name: "index_faqs_on_category"
  end

  create_table "feature_groups", force: :cascade do |t|
    t.string "name"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
  end

  create_table "financing_configurations", force: :cascade do |t|
    t.string "name", null: false
    t.integer "financing_type", default: 0, null: false
    t.decimal "interest_rate_fixed", precision: 5, scale: 2, default: "0.0"
    t.decimal "interest_rate_variable", precision: 5, scale: 2, default: "0.0"
    t.integer "grace_period_days", default: 0
    t.integer "min_installments", default: 1
    t.integer "max_installments", default: 12
    t.decimal "min_amount", precision: 15, scale: 2, default: "0.0"
    t.decimal "max_amount", precision: 15, scale: 2, default: "0.0"
    t.boolean "active", default: true
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["financing_type"], name: "index_financing_configurations_on_financing_type"
  end

  create_table "financing_options", force: :cascade do |t|
    t.bigint "company_id", null: false
    t.string "institution_name", null: false
    t.string "credit_line", null: false
    t.string "target_audience", null: false
    t.integer "max_term_months"
    t.integer "grace_period_months"
    t.decimal "interest_rate_percent", precision: 5, scale: 2
    t.text "interest_rate_details"
    t.boolean "active", default: true, null: false
    t.text "service_filters"
    t.text "project_filters"
    t.text "category_filters"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["company_id", "active"], name: "index_financing_options_on_company_id_and_active"
    t.index ["company_id"], name: "index_financing_options_on_company_id"
    t.index ["target_audience"], name: "index_financing_options_on_target_audience"
  end

  create_table "forum_answers", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.bigint "forum_question_id", null: false
    t.text "answer"
    t.string "status"
    t.datetime "requested_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["forum_question_id"], name: "index_forum_answers_on_forum_question_id"
    t.index ["user_id"], name: "index_forum_answers_on_user_id"
  end

  create_table "forum_questions", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.bigint "product_id", null: false
    t.bigint "category_id", null: false
    t.string "subject"
    t.text "description"
    t.string "status"
    t.datetime "requested_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.bigint "company_id"
    t.index ["category_id"], name: "index_forum_questions_on_category_id"
    t.index ["company_id"], name: "index_forum_questions_on_company_id"
    t.index ["product_id"], name: "index_forum_questions_on_product_id"
    t.index ["status"], name: "index_forum_questions_on_status"
    t.index ["user_id"], name: "index_forum_questions_on_user_id"
    t.check_constraint "status IS NULL OR (status::text = ANY (ARRAY['draft'::character varying, 'published'::character varying, 'archived'::character varying]::text[]))", name: "forum_questions_status_allowed"
  end

  create_table "gated_downloads", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.bigint "company_id", null: false
    t.bigint "user_id"
    t.string "anonymous_id"
    t.string "document_type", null: false
    t.string "document_title"
    t.string "document_url"
    t.string "contact_name"
    t.string "contact_email"
    t.string "contact_phone"
    t.jsonb "metadata", default: {}
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["anonymous_id"], name: "index_gated_downloads_on_anonymous_id"
    t.index ["company_id", "document_type"], name: "index_gated_downloads_on_company_id_and_document_type"
    t.index ["company_id"], name: "index_gated_downloads_on_company_id"
    t.index ["created_at"], name: "index_gated_downloads_on_created_at"
    t.index ["user_id"], name: "index_gated_downloads_on_user_id"
  end

  create_table "growth_insights", force: :cascade do |t|
    t.date "period_start"
    t.date "period_end"
    t.string "insight_type", limit: 50
    t.jsonb "insight_data"
    t.decimal "confidence", precision: 3, scale: 2
    t.boolean "actioned", default: false
    t.datetime "created_at", null: false
    t.index ["insight_type"], name: "index_growth_insights_on_insight_type"
    t.index ["period_start"], name: "index_growth_insights_on_period_start"
  end

  create_table "intent_score_histories", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.uuid "intent_score_id", null: false
    t.integer "score_before", null: false
    t.integer "score_after", null: false
    t.string "level_before", null: false
    t.string "level_after", null: false
    t.string "change_reason"
    t.jsonb "score_breakdown", default: {}
    t.string "triggered_by"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["created_at"], name: "index_intent_score_histories_on_created_at"
    t.index ["intent_score_id", "created_at"], name: "idx_histories_score_time"
    t.index ["intent_score_id"], name: "index_intent_score_histories_on_intent_score_id"
  end

  create_table "intent_scores", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.bigint "company_id", null: false
    t.bigint "lead_id"
    t.string "anonymous_id"
    t.string "session_id"
    t.integer "total_score", default: 0, null: false
    t.string "intent_level", default: "cold", null: false
    t.integer "micro_interaction_score", default: 0
    t.integer "financial_intent_score", default: 0
    t.integer "research_intent_score", default: 0
    t.integer "contact_intent_score", default: 0
    t.integer "total_signals_count", default: 0
    t.integer "hot_signals_count", default: 0
    t.integer "unique_sessions_count", default: 1
    t.integer "unique_pages_count", default: 0
    t.datetime "first_interaction_at"
    t.datetime "last_interaction_at"
    t.datetime "last_hot_signal_at"
    t.integer "days_active", default: 0
    t.float "decay_factor", default: 1.0
    t.float "position_bias_correction", default: 0.0
    t.float "confidence_score", default: 0.0
    t.string "scoring_version", default: "v1"
    t.jsonb "score_breakdown", default: {}
    t.jsonb "top_signals", default: []
    t.string "recommended_action"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["anonymous_id"], name: "index_intent_scores_on_anonymous_id"
    t.index ["company_id", "anonymous_id"], name: "idx_scores_company_anon_unique", unique: true, where: "(anonymous_id IS NOT NULL)"
    t.index ["company_id", "lead_id"], name: "idx_scores_company_lead_unique", unique: true, where: "(lead_id IS NOT NULL)"
    t.index ["company_id"], name: "index_intent_scores_on_company_id"
    t.index ["intent_level", "total_score"], name: "idx_scores_level_score"
    t.index ["intent_level"], name: "index_intent_scores_on_intent_level"
    t.index ["last_interaction_at"], name: "index_intent_scores_on_last_interaction_at"
    t.index ["lead_id"], name: "index_intent_scores_on_lead_id"
    t.index ["score_breakdown"], name: "index_intent_scores_on_score_breakdown", using: :gin
    t.index ["total_score"], name: "index_intent_scores_on_total_score"
  end

  create_table "knowledge_articles", force: :cascade do |t|
    t.string "title", null: false
    t.string "slug", null: false
    t.text "content", null: false
    t.bigint "category_id", null: false
    t.string "status", default: "published", null: false
    t.datetime "published_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["category_id"], name: "index_knowledge_articles_on_category_id"
    t.index ["slug"], name: "index_knowledge_articles_on_slug", unique: true
    t.index ["status"], name: "index_knowledge_articles_on_status"
  end

  create_table "lead_distributions", force: :cascade do |t|
    t.bigint "lead_id", null: false
    t.bigint "company_id", null: false
    t.string "status", default: "queued"
    t.datetime "assigned_at"
    t.json "payload"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["company_id"], name: "index_lead_distributions_on_company_id"
    t.index ["lead_id"], name: "index_lead_distributions_on_lead_id"
  end

  create_table "lead_wizard_field_options", force: :cascade do |t|
    t.bigint "lead_wizard_field_id", null: false
    t.string "label", null: false
    t.string "value", null: false
    t.integer "position", default: 0, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["lead_wizard_field_id", "position"], name: "index_lead_wizard_field_options_on_field_and_position"
    t.index ["lead_wizard_field_id", "value"], name: "index_lead_wizard_field_options_on_field_and_value", unique: true
    t.index ["lead_wizard_field_id"], name: "index_lead_wizard_field_options_on_lead_wizard_field_id"
  end

  create_table "lead_wizard_fields", force: :cascade do |t|
    t.bigint "lead_wizard_section_id", null: false
    t.string "key", null: false
    t.string "field_type", null: false
    t.string "label", null: false
    t.string "target", default: "wizard_answers", null: false
    t.string "placeholder"
    t.text "help_text"
    t.boolean "required", default: false, null: false
    t.integer "position", default: 0, null: false
    t.decimal "min_value", precision: 12, scale: 2
    t.decimal "max_value", precision: 12, scale: 2
    t.decimal "step_value", precision: 12, scale: 2
    t.string "error_message"
    t.string "depends_on_field_key"
    t.string "depends_on_operator"
    t.string "depends_on_value"
    t.string "default_value"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["lead_wizard_section_id", "key"], name: "index_lead_wizard_fields_on_section_and_key", unique: true
    t.index ["lead_wizard_section_id", "position"], name: "index_lead_wizard_fields_on_section_and_position"
    t.index ["lead_wizard_section_id"], name: "index_lead_wizard_fields_on_lead_wizard_section_id"
  end

  create_table "lead_wizard_sections", force: :cascade do |t|
    t.bigint "lead_wizard_version_id", null: false
    t.string "key", null: false
    t.string "title", null: false
    t.text "description"
    t.integer "position", default: 0, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["lead_wizard_version_id", "key"], name: "index_lead_wizard_sections_on_version_and_key", unique: true
    t.index ["lead_wizard_version_id", "position"], name: "index_lead_wizard_sections_on_version_and_position"
    t.index ["lead_wizard_version_id"], name: "index_lead_wizard_sections_on_lead_wizard_version_id"
  end

  create_table "lead_wizard_versions", force: :cascade do |t|
    t.bigint "company_id"
    t.bigint "category_id"
    t.string "template_key", null: false
    t.integer "template_version", default: 1, null: false
    t.integer "version_number", default: 1, null: false
    t.string "status", default: "draft", null: false
    t.string "ui_theme", default: "auto", null: false
    t.string "ui_primary_color"
    t.string "ui_logo_url"
    t.boolean "show_progress_bar", default: true, null: false
    t.string "thank_you_title"
    t.text "thank_you_message"
    t.string "thank_you_redirect_url"
    t.datetime "published_at"
    t.datetime "archived_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["category_id", "status"], name: "index_lead_wizard_versions_on_published_category", unique: true, where: "((category_id IS NOT NULL) AND ((status)::text = 'published'::text))"
    t.index ["category_id", "version_number"], name: "index_lead_wizard_versions_on_category_and_version", unique: true, where: "(category_id IS NOT NULL)"
    t.index ["category_id"], name: "index_lead_wizard_versions_on_category_id"
    t.index ["company_id", "status"], name: "index_lead_wizard_versions_on_published_company", unique: true, where: "((company_id IS NOT NULL) AND ((status)::text = 'published'::text))"
    t.index ["company_id", "version_number"], name: "index_lead_wizard_versions_on_company_and_version", unique: true, where: "(company_id IS NOT NULL)"
    t.index ["company_id"], name: "index_lead_wizard_versions_on_company_id"
    t.index ["status"], name: "index_lead_wizard_versions_on_published_global", unique: true, where: "((company_id IS NULL) AND (category_id IS NULL) AND ((status)::text = 'published'::text))"
    t.index ["version_number"], name: "index_lead_wizard_versions_on_global_version", unique: true, where: "((company_id IS NULL) AND (category_id IS NULL))"
  end

  create_table "leads", force: :cascade do |t|
    t.string "name"
    t.string "email"
    t.string "phone"
    t.string "company"
    t.text "message"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "project_type"
    t.string "estimated_budget"
    t.string "location"
    t.bigint "company_id"
    t.string "product_vertical"
    t.string "project_profile"
    t.string "quote_type"
    t.string "system_size_band"
    t.decimal "bill_value", precision: 15, scale: 2
    t.decimal "monthly_kwh", precision: 15, scale: 2
    t.string "decision_timeline"
    t.string "address_full"
    t.string "city"
    t.string "state"
    t.string "zipcode"
    t.datetime "consent_at"
    t.string "consent_ip"
    t.datetime "otp_sent_at"
    t.datetime "otp_verified_at"
    t.string "otp_code_digest"
    t.integer "otp_attempts", default: 0
    t.string "wizard_status", default: "draft"
    t.string "utm_source"
    t.string "utm_medium"
    t.string "utm_campaign"
    t.string "utm_content"
    t.string "utm_term"
    t.string "gclid"
    t.string "fbclid"
    t.string "msclkid"
    t.string "landing_path"
    t.string "referrer_host"
    t.json "attribution_json", default: {}
    t.jsonb "wizard_answers", default: {}
    t.string "template_key"
    t.integer "template_version"
    t.bigint "category_id"
    t.integer "cached_score", default: 0
    t.string "score_band"
    t.bigint "chat_lead_id"
    t.bigint "chat_session_id"
    t.string "source", default: "portal", null: false
    t.jsonb "recommended_company_ids", default: [], null: false
    t.bigint "clicked_company_id"
    t.bigint "quote_requested_company_id"
    t.bigint "whatsapp_clicked_company_id"
    t.jsonb "comparison_company_ids", default: [], null: false
    t.string "intent_type"
    t.string "vertical"
    t.string "qualification_level"
    t.integer "lead_score"
    t.text "ai_summary"
    t.string "next_best_action"
    t.text "initial_question"
    t.text "last_user_message"
    t.string "source_page_url"
    t.string "lgpd_consent_version"
    t.datetime "lgpd_consent_at"
    t.text "lgpd_consent_text"
    t.index ["category_id"], name: "index_leads_on_category_id"
    t.index ["chat_lead_id"], name: "index_leads_on_chat_lead_id"
    t.index ["chat_session_id"], name: "index_leads_on_chat_session_id"
    t.index ["clicked_company_id"], name: "index_leads_on_clicked_company_id"
    t.index ["company_id", "created_at"], name: "index_leads_on_company_id_and_created_at", order: { created_at: :desc }
    t.index ["company_id", "utm_campaign"], name: "index_leads_on_company_id_and_utm_campaign"
    t.index ["company_id", "wizard_status", "created_at"], name: "index_leads_on_company_id_and_wizard_status_and_created_at"
    t.index ["company_id"], name: "index_leads_on_company_id"
    t.index ["created_at"], name: "index_leads_on_created_at"
    t.index ["email"], name: "index_leads_on_email"
    t.index ["quote_requested_company_id"], name: "index_leads_on_quote_requested_company_id"
    t.index ["recommended_company_ids"], name: "index_leads_on_recommended_company_ids", using: :gin
    t.index ["score_band"], name: "index_leads_on_score_band"
    t.index ["source"], name: "index_leads_on_source"
    t.index ["utm_campaign"], name: "index_leads_on_utm_campaign"
    t.index ["utm_medium"], name: "index_leads_on_utm_medium"
    t.index ["utm_source"], name: "index_leads_on_utm_source"
    t.check_constraint "wizard_status::text = ANY (ARRAY['draft'::character varying, 'pending_otp'::character varying, 'verified'::character varying, 'distributed'::character varying, 'proposal_submitted'::character varying, 'proposal_processing'::character varying, 'proposal_sent'::character varying, 'proposal_failed'::character varying]::text[])", name: "ck_leads_valid_status"
  end

  create_table "news_articles", force: :cascade do |t|
    t.string "title"
    t.string "url", null: false
    t.string "source"
    t.datetime "published_at"
    t.datetime "fetched_at"
    t.string "category", limit: 50
    t.string "vertical", limit: 20
    t.string "audience", limit: 20
    t.string "sentiment", limit: 20
    t.string "urgency", limit: 20
    t.decimal "relevance_score", precision: 3, scale: 2
    t.text "summary_pt"
    t.jsonb "content_angles"
    t.jsonb "suggested_channels"
    t.string "suggested_cta", limit: 50
    t.boolean "used_in_content", default: false
    t.datetime "created_at", null: false
    t.index ["relevance_score"], name: "index_news_articles_on_relevance_score"
    t.index ["urgency"], name: "index_news_articles_on_urgency"
    t.index ["url"], name: "index_news_articles_on_url", unique: true
    t.index ["used_in_content", "relevance_score"], name: "index_news_articles_on_used_in_content_and_relevance_score", where: "(used_in_content = false)"
  end

  create_table "newsletters", force: :cascade do |t|
    t.integer "issue_number"
    t.string "subject", limit: 300
    t.text "content_html"
    t.string "status", limit: 20
    t.datetime "sent_at"
    t.integer "recipients_count"
    t.decimal "open_rate", precision: 5, scale: 2
    t.decimal "click_rate", precision: 5, scale: 2
    t.datetime "created_at", null: false
  end

  create_table "noticed_events", force: :cascade do |t|
    t.string "type"
    t.string "record_type"
    t.bigint "record_id"
    t.jsonb "params"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.integer "notifications_count"
    t.index ["record_type", "record_id"], name: "index_noticed_events_on_record"
  end

  create_table "noticed_notifications", force: :cascade do |t|
    t.string "type"
    t.bigint "event_id", null: false
    t.string "recipient_type", null: false
    t.bigint "recipient_id", null: false
    t.datetime "read_at", precision: nil
    t.datetime "seen_at", precision: nil
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["event_id"], name: "index_noticed_notifications_on_event_id"
    t.index ["recipient_type", "recipient_id"], name: "index_noticed_notifications_on_recipient"
  end

  create_table "notifications", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.string "notification_type", null: false
    t.string "title", null: false
    t.text "message"
    t.json "data"
    t.string "notifiable_type"
    t.bigint "notifiable_id"
    t.datetime "read_at"
    t.datetime "sent_at"
    t.string "delivery_channels", default: ["in_app"], array: true
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["created_at"], name: "index_notifications_on_created_at"
    t.index ["notifiable_type", "notifiable_id"], name: "index_notifications_on_notifiable"
    t.index ["notification_type"], name: "index_notifications_on_notification_type"
    t.index ["read_at"], name: "index_notifications_on_read_at"
    t.index ["user_id", "read_at"], name: "index_notifications_on_user_id_and_read_at"
    t.index ["user_id"], name: "index_notifications_on_user_id"
  end

  create_table "optimization_log", force: :cascade do |t|
    t.string "workflow_id", limit: 20
    t.string "optimization_type", limit: 50
    t.jsonb "details"
    t.datetime "created_at", null: false
    t.index ["created_at"], name: "index_optimization_log_on_created_at"
    t.index ["workflow_id"], name: "index_optimization_log_on_workflow_id"
  end

  create_table "pending_changes", force: :cascade do |t|
    t.bigint "company_id", null: false
    t.bigint "user_id"
    t.bigint "approved_by_id"
    t.string "change_type", null: false
    t.jsonb "data", default: {}
    t.string "status", default: "pending"
    t.text "rejection_reason"
    t.datetime "approved_at"
    t.datetime "rejected_at"
    t.datetime "applied_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "approved_ip"
    t.string "approved_user_agent"
    t.string "rejected_ip"
    t.string "rejected_user_agent"
    t.string "idempotency_key"
    t.index ["approved_by_id"], name: "index_pending_changes_on_approved_by_id"
    t.index ["change_type"], name: "index_pending_changes_on_change_type"
    t.index ["company_id", "idempotency_key"], name: "idx_pending_changes_idempotency_active", unique: true, where: "((status)::text = 'pending'::text)"
    t.index ["company_id", "status"], name: "index_pending_changes_on_company_id_and_status"
    t.index ["company_id"], name: "index_pending_changes_on_company_id"
    t.index ["idempotency_key"], name: "idx_pending_changes_idempotency_key"
    t.index ["status"], name: "index_pending_changes_on_status"
    t.index ["user_id"], name: "index_pending_changes_on_user_id"
  end

  create_table "plans", force: :cascade do |t|
    t.string "name"
    t.text "description"
    t.decimal "price", precision: 12, scale: 2
    t.text "features"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.jsonb "features_json", default: {}
    t.string "stripe_product_id", comment: "Stripe Product ID (prod_XXXX)"
    t.string "stripe_price_id_monthly", comment: "Stripe Price ID mensal (price_XXXX)"
    t.string "stripe_price_id_yearly", comment: "Stripe Price ID anual — reservado para v2"
    t.boolean "is_public", default: true, null: false, comment: "Exibir no /pricing público"
    t.integer "display_order", default: 0, null: false, comment: "Ordem de exibição nos cards"
    t.index ["display_order"], name: "index_plans_on_display_order"
    t.index ["is_public"], name: "index_plans_on_is_public"
    t.index ["stripe_price_id_monthly"], name: "index_plans_on_stripe_price_id_monthly", unique: true, where: "(stripe_price_id_monthly IS NOT NULL)"
    t.check_constraint "price >= 0::numeric", name: "ck_plans_valid_price"
  end

  create_table "platform_events", id: false, force: :cascade do |t|
    t.bigint "id", null: false
    t.text "event_id", null: false
    t.text "event_type", null: false
    t.integer "schema_version", default: 1
    t.text "source"
    t.text "anonymous_id"
    t.text "session_id"
    t.bigint "user_id"
    t.bigint "company_id"
    t.text "subject_type"
    t.bigint "subject_id"
    t.jsonb "payload", default: {}
    t.jsonb "context", default: {}
    t.timestamptz "occurred_at", null: false
    t.timestamptz "created_at", default: -> { "now()" }, null: false
    t.index ["context"], name: "idx_platform_events_context_gin", using: :gin
    t.index ["event_id"], name: "idx_platform_events_event_id"
    t.index ["event_type", "occurred_at"], name: "idx_platform_events_type_time", order: { occurred_at: :desc }
    t.index ["occurred_at"], name: "idx_platform_events_brin_time", using: :brin
  end

  create_table "platform_events_y2026m05", id: false, force: :cascade do |t|
    t.bigint "id", null: false
    t.text "event_id", null: false
    t.text "event_type", null: false
    t.integer "schema_version", default: 1
    t.text "source"
    t.text "anonymous_id"
    t.text "session_id"
    t.bigint "user_id"
    t.bigint "company_id"
    t.text "subject_type"
    t.bigint "subject_id"
    t.jsonb "payload", default: {}
    t.jsonb "context", default: {}
    t.timestamptz "occurred_at", null: false
    t.timestamptz "created_at", default: -> { "now()" }, null: false
    t.index ["context"], name: "platform_events_y2026m05_context_idx", using: :gin
    t.index ["event_id"], name: "platform_events_y2026m05_event_id_idx"
    t.index ["event_type", "occurred_at"], name: "platform_events_y2026m05_event_type_occurred_at_idx", order: { occurred_at: :desc }
    t.index ["occurred_at"], name: "platform_events_y2026m05_occurred_at_idx", using: :brin
  end

  create_table "platform_events_y2026m06", id: false, force: :cascade do |t|
    t.bigint "id", null: false
    t.text "event_id", null: false
    t.text "event_type", null: false
    t.integer "schema_version", default: 1
    t.text "source"
    t.text "anonymous_id"
    t.text "session_id"
    t.bigint "user_id"
    t.bigint "company_id"
    t.text "subject_type"
    t.bigint "subject_id"
    t.jsonb "payload", default: {}
    t.jsonb "context", default: {}
    t.timestamptz "occurred_at", null: false
    t.timestamptz "created_at", default: -> { "now()" }, null: false
    t.index ["context"], name: "platform_events_y2026m06_context_idx", using: :gin
    t.index ["event_id"], name: "platform_events_y2026m06_event_id_idx"
    t.index ["event_type", "occurred_at"], name: "platform_events_y2026m06_event_type_occurred_at_idx", order: { occurred_at: :desc }
    t.index ["occurred_at"], name: "platform_events_y2026m06_occurred_at_idx", using: :brin
  end

  create_table "platform_events_y2026m07", id: false, force: :cascade do |t|
    t.bigint "id", null: false
    t.text "event_id", null: false
    t.text "event_type", null: false
    t.integer "schema_version", default: 1
    t.text "source"
    t.text "anonymous_id"
    t.text "session_id"
    t.bigint "user_id"
    t.bigint "company_id"
    t.text "subject_type"
    t.bigint "subject_id"
    t.jsonb "payload", default: {}
    t.jsonb "context", default: {}
    t.timestamptz "occurred_at", null: false
    t.timestamptz "created_at", default: -> { "now()" }, null: false
    t.index ["context"], name: "platform_events_y2026m07_context_idx", using: :gin
    t.index ["event_id"], name: "platform_events_y2026m07_event_id_idx"
    t.index ["event_type", "occurred_at"], name: "platform_events_y2026m07_event_type_occurred_at_idx", order: { occurred_at: :desc }
    t.index ["occurred_at"], name: "platform_events_y2026m07_occurred_at_idx", using: :brin
  end

  create_table "platform_events_y2026m08", id: false, force: :cascade do |t|
    t.bigint "id", null: false
    t.text "event_id", null: false
    t.text "event_type", null: false
    t.integer "schema_version", default: 1
    t.text "source"
    t.text "anonymous_id"
    t.text "session_id"
    t.bigint "user_id"
    t.bigint "company_id"
    t.text "subject_type"
    t.bigint "subject_id"
    t.jsonb "payload", default: {}
    t.jsonb "context", default: {}
    t.timestamptz "occurred_at", null: false
    t.timestamptz "created_at", default: -> { "now()" }, null: false
    t.index ["context"], name: "platform_events_y2026m08_context_idx", using: :gin
    t.index ["event_id"], name: "platform_events_y2026m08_event_id_idx"
    t.index ["event_type", "occurred_at"], name: "platform_events_y2026m08_event_type_occurred_at_idx", order: { occurred_at: :desc }
    t.index ["occurred_at"], name: "platform_events_y2026m08_occurred_at_idx", using: :brin
  end

  create_table "platform_events_y2026m09", id: false, force: :cascade do |t|
    t.bigint "id", null: false
    t.text "event_id", null: false
    t.text "event_type", null: false
    t.integer "schema_version", default: 1
    t.text "source"
    t.text "anonymous_id"
    t.text "session_id"
    t.bigint "user_id"
    t.bigint "company_id"
    t.text "subject_type"
    t.bigint "subject_id"
    t.jsonb "payload", default: {}
    t.jsonb "context", default: {}
    t.timestamptz "occurred_at", null: false
    t.timestamptz "created_at", default: -> { "now()" }, null: false
    t.index ["context"], name: "platform_events_y2026m09_context_idx", using: :gin
    t.index ["event_id"], name: "platform_events_y2026m09_event_id_idx"
    t.index ["event_type", "occurred_at"], name: "platform_events_y2026m09_event_type_occurred_at_idx", order: { occurred_at: :desc }
    t.index ["occurred_at"], name: "platform_events_y2026m09_occurred_at_idx", using: :brin
  end

  create_table "platform_events_y2026m10", id: false, force: :cascade do |t|
    t.bigint "id", null: false
    t.text "event_id", null: false
    t.text "event_type", null: false
    t.integer "schema_version", default: 1
    t.text "source"
    t.text "anonymous_id"
    t.text "session_id"
    t.bigint "user_id"
    t.bigint "company_id"
    t.text "subject_type"
    t.bigint "subject_id"
    t.jsonb "payload", default: {}
    t.jsonb "context", default: {}
    t.timestamptz "occurred_at", null: false
    t.timestamptz "created_at", default: -> { "now()" }, null: false
    t.index ["context"], name: "platform_events_y2026m10_context_idx", using: :gin
    t.index ["event_id"], name: "platform_events_y2026m10_event_id_idx"
    t.index ["event_type", "occurred_at"], name: "platform_events_y2026m10_event_type_occurred_at_idx", order: { occurred_at: :desc }
    t.index ["occurred_at"], name: "platform_events_y2026m10_occurred_at_idx", using: :brin
  end

  create_table "platform_events_y2026m11", id: false, force: :cascade do |t|
    t.bigint "id", null: false
    t.text "event_id", null: false
    t.text "event_type", null: false
    t.integer "schema_version", default: 1
    t.text "source"
    t.text "anonymous_id"
    t.text "session_id"
    t.bigint "user_id"
    t.bigint "company_id"
    t.text "subject_type"
    t.bigint "subject_id"
    t.jsonb "payload", default: {}
    t.jsonb "context", default: {}
    t.timestamptz "occurred_at", null: false
    t.timestamptz "created_at", default: -> { "now()" }, null: false
    t.index ["context"], name: "platform_events_y2026m11_context_idx", using: :gin
    t.index ["event_id"], name: "platform_events_y2026m11_event_id_idx"
    t.index ["event_type", "occurred_at"], name: "platform_events_y2026m11_event_type_occurred_at_idx", order: { occurred_at: :desc }
    t.index ["occurred_at"], name: "platform_events_y2026m11_occurred_at_idx", using: :brin
  end

  create_table "platform_events_y2026m12", id: false, force: :cascade do |t|
    t.bigint "id", null: false
    t.text "event_id", null: false
    t.text "event_type", null: false
    t.integer "schema_version", default: 1
    t.text "source"
    t.text "anonymous_id"
    t.text "session_id"
    t.bigint "user_id"
    t.bigint "company_id"
    t.text "subject_type"
    t.bigint "subject_id"
    t.jsonb "payload", default: {}
    t.jsonb "context", default: {}
    t.timestamptz "occurred_at", null: false
    t.timestamptz "created_at", default: -> { "now()" }, null: false
    t.index ["context"], name: "platform_events_y2026m12_context_idx", using: :gin
    t.index ["event_id"], name: "platform_events_y2026m12_event_id_idx"
    t.index ["event_type", "occurred_at"], name: "platform_events_y2026m12_event_type_occurred_at_idx", order: { occurred_at: :desc }
    t.index ["occurred_at"], name: "platform_events_y2026m12_occurred_at_idx", using: :brin
  end

  create_table "posts", force: :cascade do |t|
    t.string "title"
    t.text "body"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.integer "views", default: 0
    t.bigint "user_id", null: false
    t.datetime "published_at"
    t.index ["user_id"], name: "index_posts_on_user_id"
  end

  create_table "pricings", force: :cascade do |t|
    t.bigint "product_id", null: false
    t.string "title"
    t.string "currency"
    t.decimal "value", precision: 12, scale: 2
    t.string "charge_type"
    t.string "frequency"
    t.string "payment_methods"
    t.integer "display_order"
    t.integer "discount"
    t.string "state"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["product_id"], name: "index_pricings_on_product_id"
  end

  create_table "product_accesses", force: :cascade do |t|
    t.bigint "product_id", null: false
    t.bigint "user_id", null: false
    t.string "status"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["product_id"], name: "index_product_accesses_on_product_id"
    t.index ["user_id"], name: "index_product_accesses_on_user_id"
  end

  create_table "product_price_histories", force: :cascade do |t|
    t.bigint "product_id", null: false
    t.decimal "price", precision: 12, scale: 2, null: false
    t.datetime "recorded_at", default: -> { "CURRENT_TIMESTAMP" }, null: false
    t.json "metadata", default: {}, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["product_id", "recorded_at"], name: "idx_product_price_histories_product_time"
    t.index ["product_id"], name: "index_product_price_histories_on_product_id"
  end

  create_table "product_specifications", force: :cascade do |t|
    t.bigint "product_id", null: false
    t.bigint "spec_template_id", null: false
    t.string "value_string"
    t.decimal "value_number", precision: 20, scale: 6
    t.boolean "value_boolean"
    t.json "value_json"
    t.string "value_unit"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["product_id", "spec_template_id"], name: "idx_product_specifications_product_template", unique: true
    t.index ["product_id"], name: "index_product_specifications_on_product_id"
    t.index ["spec_template_id"], name: "index_product_specifications_on_spec_template_id"
    t.index ["value_number"], name: "idx_product_specifications_value_number"
  end

  create_table "products", force: :cascade do |t|
    t.string "name", null: false
    t.text "description"
    t.decimal "price", precision: 12, scale: 2
    t.bigint "company_id", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.text "short_description"
    t.string "sku", null: false
    t.integer "stock"
    t.string "status"
    t.boolean "featured", default: false
    t.string "seo_title"
    t.text "seo_description"
    t.string "image_url"
    t.text "meta_description"
    t.bigint "brand_id"
    t.index ["brand_id"], name: "index_products_on_brand_id"
    t.index ["company_id"], name: "index_products_on_company_id"
    t.index ["sku"], name: "index_products_on_sku", unique: true
    t.index ["status"], name: "index_products_on_status"
    t.check_constraint "status IS NULL OR (status::text = ANY (ARRAY['draft'::character varying, 'active'::character varying, 'archived'::character varying, 'disabled'::character varying]::text[]))", name: "products_status_allowed"
  end

  create_table "rating_criteria", force: :cascade do |t|
    t.bigint "category_id"
    t.string "slug", null: false
    t.string "title", null: false
    t.text "help_text"
    t.integer "position", default: 0
    t.boolean "required", default: true
    t.boolean "allow_na", default: false
    t.boolean "active", default: true
    t.decimal "weight", precision: 3, scale: 2, default: "1.0"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["category_id", "slug"], name: "index_rating_criteria_on_category_id_and_slug", unique: true
    t.index ["category_id"], name: "index_rating_criteria_on_category_id"
    t.index ["slug"], name: "index_rating_criteria_on_slug"
  end

  create_table "review_aggregates", force: :cascade do |t|
    t.bigint "company_id", null: false
    t.bigint "category_id"
    t.decimal "average_rating", precision: 3, scale: 2, default: "0.0", null: false
    t.integer "total_reviews", default: 0, null: false
    t.jsonb "scores_distribution", default: {}, null: false
    t.jsonb "criteria_breakdown", default: {}, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["category_id"], name: "index_review_aggregates_on_category_id"
    t.index ["company_id", "category_id"], name: "idx_rev_agg_company_category", unique: true
    t.index ["company_id"], name: "index_review_aggregates_on_company_id"
  end

  create_table "review_criterion_scores", force: :cascade do |t|
    t.bigint "review_id", null: false
    t.bigint "rating_criterion_id", null: false
    t.decimal "score", precision: 2, scale: 1
    t.boolean "not_applicable", default: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "title_snapshot"
    t.decimal "weight_snapshot", precision: 3, scale: 2
    t.index ["rating_criterion_id"], name: "index_review_criterion_scores_on_rating_criterion_id"
    t.index ["review_id", "rating_criterion_id"], name: "idx_review_criterion_unique", unique: true
    t.index ["review_id"], name: "index_review_criterion_scores_on_review_id"
    t.check_constraint "score >= 1::numeric AND score <= 5::numeric", name: "ck_review_criterion_valid_score"
  end

  create_table "review_decision_logs", force: :cascade do |t|
    t.bigint "review_id", null: false
    t.bigint "admin_user_id", null: false
    t.string "action", null: false
    t.string "previous_status"
    t.string "new_status"
    t.text "notes"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["admin_user_id"], name: "index_review_decision_logs_on_admin_user_id"
    t.index ["review_id"], name: "index_review_decision_logs_on_review_id"
  end

  create_table "reviews", force: :cascade do |t|
    t.decimal "rating", precision: 2, scale: 1, null: false
    t.text "comment"
    t.bigint "user_id", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.bigint "company_id"
    t.boolean "verified", default: false
    t.boolean "featured", default: false
    t.integer "status", default: 0
    t.text "reply"
    t.datetime "replied_at"
    t.integer "display_order", default: 0, null: false
    t.integer "lock_version", default: 0, null: false
    t.string "headline"
    t.integer "project_type"
    t.integer "installation_status"
    t.decimal "estimated_power", precision: 10, scale: 2
    t.boolean "is_legacy", default: true, null: false
    t.jsonb "content_metadata", default: {}, null: false
    t.jsonb "metadata", default: {}, null: false
    t.bigint "category_id"
    t.text "pros"
    t.text "cons"
    t.text "buyer_tip"
    t.jsonb "project_context", default: {}, null: false
    t.jsonb "granular_scores_snapshot", default: {}, null: false
    t.string "capture_flow_source"
    t.index ["category_id"], name: "index_reviews_on_category_id"
    t.index ["company_id", "created_at"], name: "index_reviews_on_company_id_and_created_at"
    t.index ["company_id", "rating"], name: "index_reviews_on_company_id_and_rating", order: { rating: :desc }
    t.index ["company_id", "status", "created_at"], name: "idx_reviews_company_status_time", order: { created_at: :desc }
    t.index ["company_id", "status", "featured", "display_order"], name: "idx_reviews_social_proof"
    t.index ["company_id", "user_id"], name: "index_reviews_on_company_id_and_user_id", unique: true
    t.index ["company_id"], name: "index_reviews_on_company_id"
    t.index ["content_metadata"], name: "index_reviews_on_content_metadata", using: :gin
    t.index ["created_at"], name: "index_reviews_on_created_at"
    t.index ["granular_scores_snapshot"], name: "index_reviews_on_granular_scores_snapshot", using: :gin
    t.index ["installation_status"], name: "index_reviews_on_installation_status"
    t.index ["metadata"], name: "index_reviews_on_metadata", using: :gin
    t.index ["project_context"], name: "index_reviews_on_project_context", using: :gin
    t.index ["project_type"], name: "index_reviews_on_project_type"
    t.index ["user_id", "company_id", "category_id"], name: "idx_reviews_user_company_category", unique: true
    t.index ["user_id"], name: "index_reviews_on_user_id"
    t.check_constraint "rating >= 0::numeric AND rating <= 5::numeric", name: "chk_reviews_rating_range"
    t.check_constraint "rating >= 1::numeric AND rating <= 5::numeric", name: "ck_reviews_valid_rating"
  end

  create_table "search_zero_results", force: :cascade do |t|
    t.string "query", null: false
    t.integer "category_id"
    t.string "state"
    t.string "city"
    t.string "search_type", default: "opensearch"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["created_at"], name: "index_search_zero_results_on_created_at"
    t.index ["query"], name: "index_search_zero_results_on_query"
  end

  create_table "sector_ratings", force: :cascade do |t|
    t.bigint "company_id", null: false
    t.bigint "user_id", null: false
    t.integer "homologation", null: false
    t.integer "technical_quality", null: false
    t.integer "safety", null: false
    t.integer "consultancy", null: false
    t.decimal "total_score", precision: 4, scale: 2
    t.string "status", default: "draft", null: false
    t.text "comment"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.jsonb "answers", default: {}, null: false
    t.index ["answers"], name: "index_sector_ratings_on_answers", using: :gin
    t.index ["company_id", "user_id"], name: "index_sector_ratings_on_company_and_user", unique: true
    t.index ["company_id"], name: "index_sector_ratings_on_company_id"
    t.index ["user_id"], name: "index_sector_ratings_on_user_id"
  end

  create_table "seo_landing_pages", force: :cascade do |t|
    t.string "slug", null: false
    t.bigint "category_id", null: false
    t.string "city_name"
    t.string "state_abbr"
    t.jsonb "metadata_cache", default: {}
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["category_id"], name: "index_seo_landing_pages_on_category_id"
    t.index ["slug"], name: "index_seo_landing_pages_on_slug", unique: true
  end

  create_table "social_post_analytics", force: :cascade do |t|
    t.string "post_id", limit: 200
    t.string "platform", limit: 20
    t.bigint "content_id"
    t.datetime "published_at"
    t.integer "impressions", default: 0
    t.integer "engagements", default: 0
    t.integer "link_clicks", default: 0
    t.integer "saves", default: 0
    t.integer "shares", default: 0
    t.integer "comments", default: 0
    t.decimal "ctr", precision: 5, scale: 2
    t.datetime "fetched_at"
    t.index ["ctr"], name: "index_social_post_analytics_on_ctr"
    t.index ["platform"], name: "index_social_post_analytics_on_platform"
  end

  create_table "spec_templates", force: :cascade do |t|
    t.string "product_type", null: false
    t.string "key", null: false
    t.string "label", null: false
    t.string "value_type", null: false
    t.string "unit"
    t.json "enum_values", default: [], null: false
    t.boolean "filterable", default: false, null: false
    t.boolean "sortable", default: false, null: false
    t.boolean "comparable", default: false, null: false
    t.integer "seo_weight", default: 0, null: false
    t.boolean "required", default: false, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["comparable"], name: "index_spec_templates_on_comparable"
    t.index ["filterable"], name: "index_spec_templates_on_filterable"
    t.index ["product_type", "key"], name: "idx_spec_templates_product_type_key", unique: true
  end

  create_table "sponsored_plans", force: :cascade do |t|
    t.integer "member_id"
    t.bigint "product_id", null: false
    t.bigint "category_id", null: false
    t.bigint "plan_id", null: false
    t.string "custom_cta"
    t.boolean "active"
    t.datetime "purchased_at"
    t.datetime "start_at"
    t.datetime "end_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["category_id"], name: "index_sponsored_plans_on_category_id"
    t.index ["plan_id"], name: "index_sponsored_plans_on_plan_id"
    t.index ["product_id"], name: "index_sponsored_plans_on_product_id"
  end

  create_table "subscription_plans", force: :cascade do |t|
    t.integer "member_id"
    t.bigint "product_id", null: false
    t.bigint "category_id", null: false
    t.bigint "plan_id", null: false
    t.decimal "value", precision: 12, scale: 2
    t.string "status"
    t.datetime "purchased_at"
    t.datetime "start_at"
    t.datetime "end_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["category_id"], name: "index_subscription_plans_on_category_id"
    t.index ["plan_id"], name: "index_subscription_plans_on_plan_id"
    t.index ["product_id"], name: "index_subscription_plans_on_product_id"
    t.index ["status", "created_at"], name: "index_subscription_plans_on_status_and_created_at"
  end

  create_table "users", force: :cascade do |t|
    t.string "email", default: "", null: false
    t.string "encrypted_password", default: "", null: false
    t.string "reset_password_token"
    t.datetime "reset_password_sent_at"
    t.datetime "remember_created_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "name"
    t.integer "views", default: 0
    t.datetime "welcome_email_sent_at"
    t.datetime "last_email_sent_at"
    t.boolean "email_notifications_enabled", default: true, null: false
    t.bigint "company_id"
    t.string "role", default: "review"
    t.boolean "approved_by_admin", default: false, null: false
    t.date "date_of_birth"
    t.boolean "terms_accepted", default: false, null: false
    t.datetime "terms_accepted_at"
    t.string "provider"
    t.string "uid"
    t.string "confirmation_token"
    t.datetime "confirmed_at"
    t.datetime "confirmation_sent_at"
    t.string "unconfirmed_email"
    t.integer "status", default: 0
    t.text "rejection_reason"
    t.string "city"
    t.string "state"
    t.string "phone"
    t.boolean "public_name_consent", default: false, null: false
    t.boolean "display_full_name_consent", default: false, null: false
    t.boolean "review_name_consent", default: false, null: false
    t.boolean "lgpd_name_consent", default: false, null: false
    t.boolean "show_full_name", default: false, null: false
    t.index ["approved_by_admin"], name: "index_users_on_approved_by_admin"
    t.index ["company_id"], name: "index_users_on_company_id"
    t.index ["confirmation_token"], name: "index_users_on_confirmation_token", unique: true
    t.index ["email"], name: "index_users_on_email", unique: true
    t.index ["email_notifications_enabled"], name: "index_users_on_email_notifications_enabled"
    t.index ["provider", "uid"], name: "index_users_on_provider_and_uid"
    t.index ["reset_password_token"], name: "index_users_on_reset_password_token", unique: true
    t.index ["role"], name: "index_users_on_role"
    t.index ["status"], name: "index_users_on_status"
  end

  create_table "versions", force: :cascade do |t|
    t.string "item_type", null: false
    t.bigint "item_id", null: false
    t.string "event", null: false
    t.string "whodunnit"
    t.text "object"
    t.datetime "created_at"
    t.text "object_changes"
    t.index ["item_type", "item_id"], name: "index_versions_on_item_type_and_item_id"
  end

  create_table "whatsapp_messages", force: :cascade do |t|
    t.bigint "lead_id"
    t.bigint "company_id"
    t.string "direction", limit: 10
    t.string "message_type", limit: 50
    t.string "phone", limit: 30
    t.text "message_preview"
    t.string "status", limit: 20
    t.text "evolution_response"
    t.datetime "reply_received_at"
    t.datetime "created_at", null: false
    t.index ["lead_id"], name: "index_whatsapp_messages_on_lead_id"
    t.index ["status"], name: "index_whatsapp_messages_on_status"
  end

  add_foreign_key "active_storage_attachments", "active_storage_blobs", column: "blob_id"
  add_foreign_key "active_storage_variant_records", "active_storage_blobs", column: "blob_id"
  add_foreign_key "analytics_events", "brands"
  add_foreign_key "anonymous_sessions", "companies"
  add_foreign_key "anonymous_sessions", "users"
  add_foreign_key "articles", "admin_users", column: "author_id"
  add_foreign_key "articles", "categories"
  add_foreign_key "articles", "companies"
  add_foreign_key "articles", "products"
  add_foreign_key "banner_daily_stats", "banners"
  add_foreign_key "banner_events", "banners"
  add_foreign_key "banner_events", "companies"
  add_foreign_key "banner_subscriptions", "banner_offers"
  add_foreign_key "banner_subscriptions", "companies"
  add_foreign_key "banners", "admin_users", column: "approved_by_admin_user_id"
  add_foreign_key "banners", "categories"
  add_foreign_key "banners", "companies"
  add_foreign_key "banners_categories", "banners"
  add_foreign_key "banners_categories", "categories"
  add_foreign_key "billing_admin_actions", "admin_users"
  add_foreign_key "billing_admin_actions", "billing_company_subscriptions", column: "company_subscription_id", on_delete: :nullify
  add_foreign_key "billing_admin_actions", "companies"
  add_foreign_key "billing_audit_logs", "companies"
  add_foreign_key "billing_audit_logs", "users"
  add_foreign_key "billing_company_subscriptions", "companies"
  add_foreign_key "billing_company_subscriptions", "plans"
  add_foreign_key "buyer_intent_activities", "companies"
  add_foreign_key "buyer_intent_activities", "users"
  add_foreign_key "campaign_reviews", "companies"
  add_foreign_key "campaign_reviews", "products"
  add_foreign_key "campaigns", "companies"
  add_foreign_key "categories_companies", "categories"
  add_foreign_key "categories_companies", "companies"
  add_foreign_key "categories_products", "categories"
  add_foreign_key "categories_products", "products"
  add_foreign_key "category_lead_wizards", "categories"
  add_foreign_key "chat_lead_activities", "chat_leads"
  add_foreign_key "chat_leads", "chat_sessions"
  add_foreign_key "chat_messages", "chat_sessions"
  add_foreign_key "chat_sessions", "users"
  add_foreign_key "comments", "posts"
  add_foreign_key "comments", "users"
  add_foreign_key "companies", "plans"
  add_foreign_key "company_access_requests", "admin_users", column: "reviewed_by_admin_user_id"
  add_foreign_key "company_access_requests", "companies"
  add_foreign_key "company_access_requests", "users"
  add_foreign_key "company_badges", "badges"
  add_foreign_key "company_badges", "companies"
  add_foreign_key "company_buttons", "companies"
  add_foreign_key "company_faqs", "companies"
  add_foreign_key "company_financing_offers", "companies"
  add_foreign_key "company_financing_partners", "companies"
  add_foreign_key "company_financing_profiles", "companies"
  add_foreign_key "company_members", "companies"
  add_foreign_key "company_members", "users"
  add_foreign_key "company_sector_questions", "companies"
  add_foreign_key "company_utm_attributions", "companies"
  add_foreign_key "company_videos", "companies"
  add_foreign_key "company_webhooks", "companies"
  add_foreign_key "consent_logs", "users"
  add_foreign_key "conversations", "companies"
  add_foreign_key "conversations", "users"
  add_foreign_key "direct_messages", "conversations"
  add_foreign_key "financing_options", "companies"
  add_foreign_key "forum_answers", "forum_questions"
  add_foreign_key "forum_answers", "users"
  add_foreign_key "forum_questions", "categories"
  add_foreign_key "forum_questions", "companies"
  add_foreign_key "forum_questions", "products"
  add_foreign_key "forum_questions", "users"
  add_foreign_key "gated_downloads", "companies"
  add_foreign_key "gated_downloads", "users"
  add_foreign_key "intent_score_histories", "intent_scores"
  add_foreign_key "intent_scores", "companies"
  add_foreign_key "knowledge_articles", "categories"
  add_foreign_key "lead_distributions", "companies"
  add_foreign_key "lead_distributions", "leads"
  add_foreign_key "lead_wizard_field_options", "lead_wizard_fields"
  add_foreign_key "lead_wizard_fields", "lead_wizard_sections"
  add_foreign_key "lead_wizard_sections", "lead_wizard_versions"
  add_foreign_key "lead_wizard_versions", "categories"
  add_foreign_key "lead_wizard_versions", "companies"
  add_foreign_key "leads", "categories"
  add_foreign_key "leads", "chat_leads"
  add_foreign_key "leads", "chat_sessions"
  add_foreign_key "leads", "companies"
  add_foreign_key "notifications", "users"
  add_foreign_key "pending_changes", "admin_users", column: "approved_by_id"
  add_foreign_key "pending_changes", "companies"
  add_foreign_key "pending_changes", "users"
  add_foreign_key "posts", "users"
  add_foreign_key "pricings", "products"
  add_foreign_key "product_accesses", "products"
  add_foreign_key "product_accesses", "users"
  add_foreign_key "product_price_histories", "products"
  add_foreign_key "product_specifications", "products"
  add_foreign_key "product_specifications", "spec_templates"
  add_foreign_key "products", "brands"
  add_foreign_key "products", "companies"
  add_foreign_key "rating_criteria", "categories"
  add_foreign_key "review_aggregates", "categories"
  add_foreign_key "review_aggregates", "companies"
  add_foreign_key "review_criterion_scores", "rating_criteria"
  add_foreign_key "review_criterion_scores", "reviews"
  add_foreign_key "review_decision_logs", "admin_users"
  add_foreign_key "review_decision_logs", "reviews"
  add_foreign_key "reviews", "categories"
  add_foreign_key "reviews", "companies"
  add_foreign_key "reviews", "users"
  add_foreign_key "sector_ratings", "companies"
  add_foreign_key "sector_ratings", "users"
  add_foreign_key "seo_landing_pages", "categories"
  add_foreign_key "sponsored_plans", "categories"
  add_foreign_key "sponsored_plans", "plans"
  add_foreign_key "sponsored_plans", "products"
  add_foreign_key "subscription_plans", "categories"
  add_foreign_key "subscription_plans", "plans"
  add_foreign_key "subscription_plans", "products"
  add_foreign_key "users", "companies"
end
