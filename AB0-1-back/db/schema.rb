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

ActiveRecord::Schema[7.0].define(version: 2026_02_27_223544) do
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
    t.integer "resource_id"
    t.string "author_type"
    t.integer "author_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["author_type", "author_id"], name: "index_active_admin_comments_on_author"
    t.index ["namespace"], name: "index_active_admin_comments_on_namespace"
    t.index ["resource_type", "resource_id"], name: "index_active_admin_comments_on_resource"
  end

  create_table "active_storage_attachments", force: :cascade do |t|
    t.string "name", null: false
    t.string "record_type", null: false
    t.integer "record_id", null: false
    t.integer "blob_id", null: false
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
    t.integer "byte_size", null: false
    t.string "checksum"
    t.datetime "created_at", null: false
    t.index ["key"], name: "index_active_storage_blobs_on_key", unique: true
  end

  create_table "active_storage_variant_records", force: :cascade do |t|
    t.integer "blob_id", null: false
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
    t.boolean "two_factor_enabled", default: false
    t.index ["email"], name: "index_admin_users_on_email", unique: true
    t.index ["reset_password_token"], name: "index_admin_users_on_reset_password_token", unique: true
  end

  create_table "analytics_event_dedup", primary_key: "event_id", id: :text, force: :cascade do |t|
    t.datetime "inserted_at", default: -> { "NOW()" }, null: false
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
    t.index ["company_id", "created_at"], name: "idx_analytics_company_time", order: { created_at: :desc }
    t.index ["company_id", "event_type", "tracked_at"], name: "index_analytics_events_company_event_time"
    t.index ["company_id", "tracked_at"], name: "index_analytics_events_on_company_id_and_tracked_at"
    t.index ["event_id"], name: "index_analytics_events_on_event_id", unique: true
    t.index ["event_type", "tracked_at"], name: "index_analytics_events_on_event_type_and_tracked_at"
  end

  create_table "analytics_processing_state", primary_key: "pipeline_name", id: :text, force: :cascade do |t|
    t.datetime "last_processed_at", null: false
    t.datetime "updated_at", default: -> { "CURRENT_TIMESTAMP" }, null: false
  end

  create_table "articles", force: :cascade do |t|
    t.string "title"
    t.text "content"
    t.integer "category_id", null: false
    t.integer "product_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "slug"
    t.text "excerpt"
    t.string "meta_title"
    t.string "meta_description"
    t.datetime "published_at"
    t.string "status"
    t.boolean "featured"
    t.integer "views_count"
    t.integer "author_id"
    t.boolean "sponsored"
    t.string "sponsored_label"
    t.index ["author_id"], name: "index_articles_on_author_id"
    t.index ["category_id"], name: "index_articles_on_category_id"
    t.index ["product_id"], name: "index_articles_on_product_id"
    t.index ["slug"], name: "index_articles_on_slug"
  end

  create_table "articles_companies", id: false, force: :cascade do |t|
    t.integer "article_id", null: false
    t.integer "company_id", null: false
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
    t.integer "banner_id", null: false
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
    t.integer "banner_id", null: false
    t.integer "company_id"
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
    t.integer "company_id", null: false
    t.integer "banner_offer_id", null: false
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
    t.index ["company_id", "status"], name: "idx_banner_subs_company_active", where: "status = 'active' /*application:RailsBlogDemo*/ /*application:RailsBlogDemo*/ /*application:RailsBlogDemo*/ /*application:RailsBlogDemo*/ /*application:RailsBlogDemo*/ /*application:RailsBlogDemo*/"
    t.index ["company_id"], name: "index_banner_subscriptions_on_company_id"
    t.index ["payment_reference"], name: "index_banner_subscriptions_on_payment_reference"
    t.index ["status"], name: "index_banner_subscriptions_on_status"
  end

  create_table "banners", force: :cascade do |t|
    t.string "title"
    t.string "image_url"
    t.string "link"
    t.boolean "active", default: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.integer "category_id"
    t.boolean "sponsored", default: false
    t.string "banner_type"
    t.string "position"
    t.datetime "start_date"
    t.datetime "end_date"
    t.integer "company_id"
    t.string "moderation_status", default: "draft"
    t.integer "priority", default: 100
    t.string "slot_key"
    t.integer "approved_by_admin_user_id"
    t.datetime "approved_at"
    t.text "rejected_reason"
    t.integer "width"
    t.integer "height"
    t.index ["active", "moderation_status", "position"], name: "idx_banners_active_approved", where: "active = true AND moderation_status = 'approved' /*application:RailsBlogDemo*/ /*application:RailsBlogDemo*/ /*application:RailsBlogDemo*/ /*application:RailsBlogDemo*/ /*application:RailsBlogDemo*/ /*application:RailsBlogDemo*/ /*application:RailsBlogDemo*/ /*application:RailsBlogDemo*/"
    t.index ["approved_by_admin_user_id"], name: "index_banners_on_approved_by_admin_user_id"
    t.index ["category_id"], name: "index_banners_on_category_id"
    t.index ["company_id"], name: "index_banners_on_company_id"
    t.index ["end_date"], name: "index_banners_on_end_date"
    t.index ["moderation_status"], name: "index_banners_on_moderation_status"
    t.index ["priority", "sponsored", "created_at"], name: "idx_banners_priority_order", where: "active = true AND moderation_status = 'approved' /*application:RailsBlogDemo*/ /*application:RailsBlogDemo*/ /*application:RailsBlogDemo*/ /*application:RailsBlogDemo*/ /*application:RailsBlogDemo*/ /*application:RailsBlogDemo*/ /*application:RailsBlogDemo*/ /*application:RailsBlogDemo*/"
    t.index ["priority"], name: "index_banners_on_priority"
    t.index ["slot_key"], name: "index_banners_on_slot_key"
    t.index ["start_date", "end_date"], name: "idx_banners_date_range", where: "active = true /*application:RailsBlogDemo*/ /*application:RailsBlogDemo*/ /*application:RailsBlogDemo*/ /*application:RailsBlogDemo*/ /*application:RailsBlogDemo*/ /*application:RailsBlogDemo*/ /*application:RailsBlogDemo*/ /*application:RailsBlogDemo*/"
    t.index ["start_date"], name: "index_banners_on_start_date"
  end

  create_table "banners_categories", id: false, force: :cascade do |t|
    t.integer "banner_id", null: false
    t.integer "category_id", null: false
    t.index ["banner_id", "category_id"], name: "idx_banners_categories_unique", unique: true
    t.index ["banner_id", "category_id"], name: "index_banners_categories_unique", unique: true
    t.index ["banner_id"], name: "index_banners_categories_on_banner_id"
    t.index ["category_id"], name: "index_banners_categories_on_category_id"
  end

  create_table "campaign_reviews", force: :cascade do |t|
    t.integer "product_id", null: false
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
    t.index ["product_id"], name: "index_campaign_reviews_on_product_id"
  end

  create_table "campaigns", force: :cascade do |t|
    t.string "name"
    t.text "description"
    t.date "start_date"
    t.date "end_date"
    t.decimal "budget"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.integer "company_id"
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
    t.integer "company_id", null: false
    t.integer "category_id", null: false
    t.index ["category_id", "company_id"], name: "index_categories_companies_on_category_id_and_company_id"
    t.index ["company_id", "category_id"], name: "index_categories_companies_on_company_id_and_category_id"
  end

  create_table "categories_products", id: false, force: :cascade do |t|
    t.integer "product_id", null: false
    t.integer "category_id", null: false
    t.index ["category_id", "product_id"], name: "index_categories_products_on_category_id_and_product_id"
    t.index ["product_id", "category_id"], name: "index_categories_products_on_product_id_and_category_id"
  end

  create_table "category_lead_wizards", force: :cascade do |t|
    t.integer "category_id", null: false
    t.boolean "enabled", default: true, null: false
    t.string "template_key"
    t.integer "template_version", default: 1
    t.json "schema", default: {}
    t.json "thank_you_config", default: {}
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["category_id"], name: "index_category_lead_wizards_on_category_id", unique: true
  end

  create_table "comments", force: :cascade do |t|
    t.integer "post_id", null: false
    t.integer "user_id", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["post_id"], name: "index_comments_on_post_id"
    t.index ["user_id"], name: "index_comments_on_user_id"
  end

  create_table "companies", force: :cascade do |t|
    t.string "name"
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
    t.decimal "rating_cache", precision: 3, scale: 1
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
    t.json "ctas_json", default: {}
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
    t.json "social_media", default: {}
    t.json "project_types"
    t.json "services_offered", default: [], null: false
    t.string "whatsapp_url"
    t.boolean "whatsapp_enabled"
    t.boolean "effect", default: false, null: false
    t.integer "profile_views_count", default: 0, null: false
    t.integer "cta_clicks_count", default: 0, null: false
    t.integer "whatsapp_clicks_count", default: 0, null: false
    t.integer "plan_id"
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
    t.json "niche_tags", default: []
    t.integer "financing_partners_count", default: 0
    t.integer "company_members_count", default: 0
    t.integer "leads_count", default: 0
    t.index ["api_key"], name: "index_companies_on_api_key"
    t.index ["cnpj"], name: "index_companies_on_cnpj", unique: true, where: "cnpj IS NOT NULL /*application:RailsBlogDemo*/"
    t.index ["cta_clicks_count"], name: "index_companies_on_cta_clicks_count"
    t.index ["effect"], name: "index_companies_on_effect"
    t.index ["featured"], name: "index_companies_on_featured_true", where: "featured = true /*application:RailsBlogDemo*/ /*application:RailsBlogDemo*/ /*application:RailsBlogDemo*/ /*application:RailsBlogDemo*/ /*application:RailsBlogDemo*/ /*application:RailsBlogDemo*/ /*application:RailsBlogDemo*/ /*application:RailsBlogDemo*/ /*application:RailsBlogDemo*/ /*application:RailsBlogDemo*/ /*application:RailsBlogDemo*/ /*application:RailsBlogDemo*/ /*application:RailsBlogDemo*/"
    t.index ["financing_partners_count"], name: "index_companies_on_financing_partners_count"
    t.index ["leads_count"], name: "index_companies_on_leads_count"
    t.index ["niche_tags"], name: "index_companies_on_niche_tags"
    t.index ["plan_id"], name: "index_companies_on_plan_id"
    t.index ["priority_score"], name: "index_companies_on_priority_score"
    t.index ["profile_views_count"], name: "index_companies_on_profile_views_count"
    t.index ["reviews_count"], name: "index_companies_on_reviews_count"
    t.index ["sector_rating_avg"], name: "index_companies_on_sector_rating_avg", where: "sector_rating_avg IS NOT NULL /*application:RailsBlogDemo*/"
    t.index ["slug"], name: "index_companies_on_slug", unique: true
    t.index ["social_proof_enabled"], name: "index_companies_on_social_proof_enabled"
    t.index ["sponsored"], name: "index_companies_on_sponsored"
    t.index ["state", "city"], name: "index_companies_on_state_and_city"
    t.index ["status", "active_admin"], name: "index_companies_on_status_and_active_admin"
    t.index ["verified"], name: "index_companies_on_verified_true", where: "verified = true /*application:RailsBlogDemo*/ /*application:RailsBlogDemo*/ /*application:RailsBlogDemo*/ /*application:RailsBlogDemo*/ /*application:RailsBlogDemo*/ /*application:RailsBlogDemo*/ /*application:RailsBlogDemo*/ /*application:RailsBlogDemo*/ /*application:RailsBlogDemo*/ /*application:RailsBlogDemo*/ /*application:RailsBlogDemo*/ /*application:RailsBlogDemo*/ /*application:RailsBlogDemo*/"
    t.index ["whatsapp_clicks_count"], name: "index_companies_on_whatsapp_clicks_count"
  end

  create_table "company_access_requests", force: :cascade do |t|
    t.integer "user_id", null: false
    t.integer "company_id", null: false
    t.string "status", default: "pending", null: false
    t.text "message"
    t.text "admin_note"
    t.datetime "requested_at", default: -> { "CURRENT_TIMESTAMP" }, null: false
    t.datetime "reviewed_at"
    t.integer "reviewed_by_admin_user_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["company_id"], name: "index_company_access_requests_on_company_id"
    t.index ["reviewed_by_admin_user_id"], name: "index_company_access_requests_on_reviewed_by_admin_user_id"
    t.index ["status"], name: "index_company_access_requests_on_status"
    t.index ["user_id", "company_id"], name: "index_company_access_requests_on_user_company_active", unique: true, where: "status IN ('pending','approved') /*application:RailsBlogDemo*/ /*application:RailsBlogDemo*/ /*application:RailsBlogDemo*/ /*application:RailsBlogDemo*/ /*application:RailsBlogDemo*/ /*application:RailsBlogDemo*/ /*application:RailsBlogDemo*/ /*application:RailsBlogDemo*/"
    t.index ["user_id"], name: "index_company_access_requests_on_user_id"
  end

  create_table "company_anomaly_daily", id: false, force: :cascade do |t|
    t.bigint "company_id", null: false
    t.date "day", null: false
    t.text "metric", null: false
    t.decimal "zscore", precision: 8, scale: 4, null: false
    t.boolean "flagged", null: false
    t.datetime "created_at", default: -> { "CURRENT_TIMESTAMP" }, null: false
    t.datetime "updated_at", default: -> { "CURRENT_TIMESTAMP" }, null: false
    t.index ["company_id", "flagged"], name: "index_company_anomaly_daily_on_company_id_and_flagged"
  end

  create_table "company_badges", force: :cascade do |t|
    t.integer "company_id", null: false
    t.integer "badge_id", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["badge_id"], name: "index_company_badges_on_badge_id"
    t.index ["company_id", "badge_id"], name: "index_company_badges_on_company_id_and_badge_id", unique: true
    t.index ["company_id"], name: "index_company_badges_on_company_id"
  end

  create_table "company_buttons", force: :cascade do |t|
    t.integer "company_id", null: false
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
    t.index ["company_id", "day"], name: "index_company_daily_stats_on_company_id_and_day", unique: true
    t.index ["day"], name: "index_company_daily_stats_on_day"
  end

  create_table "company_faqs", force: :cascade do |t|
    t.integer "company_id", null: false
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

  create_table "company_feature_daily", id: false, force: :cascade do |t|
    t.bigint "company_id", null: false
    t.date "day", null: false
    t.decimal "engagement_score", precision: 10, scale: 4, default: "0.0"
    t.decimal "lead_conversion_rate", precision: 5, scale: 4, default: "0.0"
    t.integer "review_velocity", default: 0
    t.decimal "unique_session_ratio", precision: 5, scale: 4, default: "0.0"
    t.datetime "updated_at", default: -> { "CURRENT_TIMESTAMP" }, null: false
    t.datetime "created_at", default: -> { "CURRENT_TIMESTAMP" }, null: false
  end

  create_table "company_feature_rolling_30d", primary_key: "company_id", force: :cascade do |t|
    t.datetime "computed_at", default: -> { "CURRENT_TIMESTAMP" }, null: false
    t.decimal "avg_engagement", precision: 10, scale: 4, default: "0.0"
    t.integer "total_leads", default: 0
    t.integer "total_views", default: 0
    t.decimal "conversion_trend", precision: 10, scale: 4, default: "0.0"
    t.datetime "created_at", default: -> { "CURRENT_TIMESTAMP" }, null: false
    t.datetime "updated_at", default: -> { "CURRENT_TIMESTAMP" }, null: false
  end

  create_table "company_financing_offers", force: :cascade do |t|
    t.integer "company_id", null: false
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
    t.integer "company_id", null: false
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
    t.integer "company_id", null: false
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
    t.integer "company_id", null: false
    t.integer "user_id", null: false
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
    t.datetime "computed_at", default: -> { "CURRENT_TIMESTAMP" }, null: false
    t.json "breakdown", default: "{}", null: false
    t.datetime "created_at", default: -> { "CURRENT_TIMESTAMP" }, null: false
    t.datetime "updated_at", default: -> { "CURRENT_TIMESTAMP" }, null: false
    t.index ["score"], name: "index_company_ranking_score_on_score", order: :desc
  end

  create_table "company_sector_questions", force: :cascade do |t|
    t.integer "company_id", null: false
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
    t.json "components", null: false
    t.datetime "computed_at", default: -> { "CURRENT_TIMESTAMP" }, null: false
    t.datetime "created_at", default: -> { "CURRENT_TIMESTAMP" }, null: false
    t.datetime "updated_at", default: -> { "CURRENT_TIMESTAMP" }, null: false
    t.index ["score"], name: "index_company_trust_score_on_score", order: :desc
  end

  create_table "company_videos", force: :cascade do |t|
    t.integer "company_id", null: false
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
    t.json "required_keys", default: "[]", null: false
    t.json "pii_keys", default: "[]", null: false
    t.json "retention_policy", default: "{\"months\": 24}", null: false
    t.boolean "enabled", default: true, null: false
    t.text "description"
    t.datetime "created_at", default: -> { "CURRENT_TIMESTAMP" }, null: false
    t.datetime "updated_at", default: -> { "CURRENT_TIMESTAMP" }, null: false
  end

  create_table "event_ingest_errors", force: :cascade do |t|
    t.text "event_id"
    t.text "event_type"
    t.json "payload"
    t.text "error_reason"
    t.datetime "occurred_at", default: -> { "CURRENT_TIMESTAMP" }, null: false
    t.datetime "created_at", default: -> { "CURRENT_TIMESTAMP" }, null: false
    t.datetime "updated_at", default: -> { "CURRENT_TIMESTAMP" }, null: false
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
    t.integer "company_id", null: false
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
    t.integer "user_id", null: false
    t.integer "forum_question_id", null: false
    t.text "answer"
    t.string "status"
    t.datetime "requested_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["forum_question_id"], name: "index_forum_answers_on_forum_question_id"
    t.index ["user_id"], name: "index_forum_answers_on_user_id"
  end

  create_table "forum_questions", force: :cascade do |t|
    t.integer "user_id", null: false
    t.integer "product_id", null: false
    t.integer "category_id", null: false
    t.string "subject"
    t.text "description"
    t.string "status"
    t.datetime "requested_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["category_id"], name: "index_forum_questions_on_category_id"
    t.index ["product_id"], name: "index_forum_questions_on_product_id"
    t.index ["user_id"], name: "index_forum_questions_on_user_id"
  end

  create_table "lead_distributions", force: :cascade do |t|
    t.integer "lead_id", null: false
    t.integer "company_id", null: false
    t.string "status", default: "queued"
    t.datetime "assigned_at"
    t.json "payload"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["company_id"], name: "index_lead_distributions_on_company_id"
    t.index ["lead_id"], name: "index_lead_distributions_on_lead_id"
  end

  create_table "leads", force: :cascade do |t|
    t.string "name"
    t.string "email"
    t.string "phone"
    t.string "company"
    t.text "message"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.integer "company_id"
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
    t.json "wizard_answers", default: {}
    t.string "template_key"
    t.integer "template_version"
    t.integer "category_id"
    t.index ["category_id"], name: "index_leads_on_category_id"
    t.index ["company_id", "created_at"], name: "index_leads_on_company_id_and_created_at", order: { created_at: :desc }
    t.index ["company_id", "utm_campaign"], name: "index_leads_on_company_id_and_utm_campaign"
    t.index ["company_id", "wizard_status", "created_at"], name: "index_leads_on_company_id_and_wizard_status_and_created_at"
    t.index ["company_id"], name: "index_leads_on_company_id"
    t.index ["created_at"], name: "index_leads_on_created_at"
    t.index ["utm_campaign"], name: "index_leads_on_utm_campaign"
    t.index ["utm_source"], name: "index_leads_on_utm_source"
    t.check_constraint "wizard_status IN ('draft', 'pending_otp', 'verified', 'distributed', 'proposal_submitted', 'proposal_processing', 'proposal_sent', 'proposal_failed')", name: "ck_leads_valid_status"
  end

  create_table "noticed_events", force: :cascade do |t|
    t.string "type"
    t.string "record_type"
    t.bigint "record_id"
    t.json "params"
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

  create_table "pending_changes", force: :cascade do |t|
    t.integer "company_id", null: false
    t.integer "user_id"
    t.integer "approved_by_id"
    t.string "change_type", null: false
    t.json "data", default: {}
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
    t.index ["approved_by_id"], name: "index_pending_changes_on_approved_by_id"
    t.index ["change_type"], name: "index_pending_changes_on_change_type"
    t.index ["company_id", "status"], name: "index_pending_changes_on_company_id_and_status"
    t.index ["company_id"], name: "index_pending_changes_on_company_id"
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
    t.text "features_json", default: "{}"
    t.check_constraint "price >= 0", name: "ck_plans_valid_price"
  end

  create_table "platform_events", force: :cascade do |t|
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
    t.json "payload", default: {}
    t.json "context", default: {}
    t.datetime "occurred_at", null: false
    t.datetime "created_at", default: -> { "CURRENT_TIMESTAMP" }, null: false
    t.index ["event_id"], name: "index_platform_events_on_event_id"
    t.index ["event_type", "occurred_at"], name: "index_platform_events_on_event_type_and_occurred_at"
  end

  create_table "posts", force: :cascade do |t|
    t.string "title"
    t.text "body"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.integer "views", default: 0
    t.integer "user_id", null: false
    t.datetime "published_at"
    t.index ["user_id"], name: "index_posts_on_user_id"
  end

  create_table "pricings", force: :cascade do |t|
    t.integer "product_id", null: false
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
    t.integer "product_id", null: false
    t.integer "user_id", null: false
    t.string "status"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["product_id"], name: "index_product_accesses_on_product_id"
    t.index ["user_id"], name: "index_product_accesses_on_user_id"
  end

  create_table "product_price_histories", force: :cascade do |t|
    t.integer "product_id", null: false
    t.decimal "price", precision: 12, scale: 2, null: false
    t.datetime "recorded_at", default: -> { "CURRENT_TIMESTAMP" }, null: false
    t.json "metadata", default: {}, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["product_id", "recorded_at"], name: "idx_product_price_histories_product_time"
    t.index ["product_id"], name: "index_product_price_histories_on_product_id"
  end

  create_table "product_specifications", force: :cascade do |t|
    t.integer "product_id", null: false
    t.integer "spec_template_id", null: false
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
    t.string "name"
    t.text "description"
    t.decimal "price", precision: 12, scale: 2
    t.integer "company_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.text "short_description"
    t.string "sku", null: false
    t.integer "stock"
    t.string "status"
    t.boolean "featured", default: false
    t.string "seo_title"
    t.text "seo_description"
    t.index ["company_id"], name: "index_products_on_company_id"
    t.index ["sku"], name: "index_products_on_sku", unique: true
  end

  create_table "review_decision_logs", force: :cascade do |t|
    t.integer "review_id", null: false
    t.integer "admin_user_id", null: false
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
    t.decimal "rating", precision: 2, scale: 1
    t.text "comment"
    t.integer "user_id", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.integer "company_id"
    t.boolean "verified", default: false
    t.boolean "featured", default: false
    t.integer "status", default: 0
    t.text "reply"
    t.datetime "replied_at"
    t.integer "display_order", default: 0, null: false
    t.integer "lock_version", default: 0, null: false
    t.index ["company_id", "created_at"], name: "index_reviews_on_company_id_and_created_at"
    t.index ["company_id", "rating"], name: "index_reviews_on_company_id_and_rating", order: { rating: :desc }
    t.index ["company_id", "status", "featured", "display_order"], name: "idx_reviews_social_proof"
    t.index ["company_id", "user_id"], name: "index_reviews_on_company_id_and_user_id", unique: true
    t.index ["company_id"], name: "index_reviews_on_company_id"
    t.index ["user_id"], name: "index_reviews_on_user_id"
    t.check_constraint "rating >= 1 AND rating <= 5", name: "ck_reviews_valid_rating"
  end

  create_table "sector_ratings", force: :cascade do |t|
    t.integer "company_id", null: false
    t.integer "user_id", null: false
    t.integer "homologation", null: false
    t.integer "technical_quality", null: false
    t.integer "safety", null: false
    t.integer "consultancy", null: false
    t.decimal "total_score", precision: 4, scale: 2
    t.string "status", default: "draft", null: false
    t.text "comment"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.json "answers", default: {}, null: false
    t.index ["answers"], name: "index_sector_ratings_on_answers"
    t.index ["company_id", "user_id"], name: "index_sector_ratings_on_company_and_user", unique: true
    t.index ["company_id"], name: "index_sector_ratings_on_company_id"
    t.index ["user_id"], name: "index_sector_ratings_on_user_id"
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
    t.integer "product_id", null: false
    t.integer "category_id", null: false
    t.integer "plan_id", null: false
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
    t.integer "product_id", null: false
    t.integer "category_id", null: false
    t.integer "plan_id", null: false
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
    t.date "date_of_birth"
    t.boolean "terms_accepted", default: false, null: false
    t.datetime "terms_accepted_at"
    t.string "provider"
    t.string "uid"
    t.string "confirmation_token"
    t.datetime "confirmed_at"
    t.datetime "confirmation_sent_at"
    t.string "unconfirmed_email"
    t.string "role", default: "review"
    t.integer "status", default: 0
    t.text "rejection_reason"
    t.integer "company_id"
    t.boolean "approved_by_admin", default: false, null: false
    t.string "city"
    t.string "state"
    t.string "phone"
    t.index ["company_id"], name: "index_users_on_company_id"
    t.index ["confirmation_token"], name: "index_users_on_confirmation_token", unique: true
    t.index ["email"], name: "index_users_on_email", unique: true
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

  add_foreign_key "active_storage_attachments", "active_storage_blobs", column: "blob_id"
  add_foreign_key "active_storage_variant_records", "active_storage_blobs", column: "blob_id"
  add_foreign_key "articles", "admin_users", column: "author_id"
  add_foreign_key "articles", "categories"
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
  add_foreign_key "campaign_reviews", "products"
  add_foreign_key "campaigns", "companies"
  add_foreign_key "categories_companies", "categories"
  add_foreign_key "categories_companies", "companies"
  add_foreign_key "categories_products", "categories"
  add_foreign_key "categories_products", "products"
  add_foreign_key "category_lead_wizards", "categories"
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
  add_foreign_key "company_videos", "companies"
  add_foreign_key "financing_options", "companies"
  add_foreign_key "forum_answers", "forum_questions"
  add_foreign_key "forum_answers", "users"
  add_foreign_key "forum_questions", "categories"
  add_foreign_key "forum_questions", "products"
  add_foreign_key "forum_questions", "users"
  add_foreign_key "lead_distributions", "companies"
  add_foreign_key "lead_distributions", "leads"
  add_foreign_key "leads", "categories"
  add_foreign_key "leads", "companies"
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
  add_foreign_key "products", "companies"
  add_foreign_key "review_decision_logs", "admin_users"
  add_foreign_key "review_decision_logs", "reviews"
  add_foreign_key "reviews", "companies"
  add_foreign_key "reviews", "users"
  add_foreign_key "sector_ratings", "companies"
  add_foreign_key "sector_ratings", "users"
  add_foreign_key "sponsored_plans", "categories"
  add_foreign_key "sponsored_plans", "plans"
  add_foreign_key "sponsored_plans", "products"
  add_foreign_key "subscription_plans", "categories"
  add_foreign_key "subscription_plans", "plans"
  add_foreign_key "subscription_plans", "products"
  add_foreign_key "users", "companies"
end
