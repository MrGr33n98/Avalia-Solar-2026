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

ActiveRecord::Schema[7.0].define(version: 2025_11_18_003049) do
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
    t.index ["email"], name: "index_admin_users_on_email", unique: true
    t.index ["reset_password_token"], name: "index_admin_users_on_reset_password_token", unique: true
  end

  create_table "articles", force: :cascade do |t|
    t.string "title"
    t.text "content"
    t.integer "category_id", null: false
    t.integer "product_id", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["category_id"], name: "index_articles_on_category_id"
    t.index ["product_id"], name: "index_articles_on_product_id"
  end

  create_table "badges", force: :cascade do |t|
    t.string "name"
    t.text "description"
    t.integer "position"
    t.integer "year"
    t.string "edition"
    t.integer "category_id", null: false
    t.string "products"
    t.string "image"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["category_id"], name: "index_badges_on_category_id"
  end

  create_table "banner_globals", force: :cascade do |t|
    t.string "title", null: false
    t.string "link", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
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
    t.index ["category_id"], name: "index_banners_on_category_id"
    t.index ["end_date"], name: "index_banners_on_end_date"
    t.index ["start_date"], name: "index_banners_on_start_date"
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
    t.index ["seo_url"], name: "index_categories_on_seo_url", unique: true
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
    t.json "project_types", default: [], null: false
    t.json "services_offered", default: [], null: false
    t.string "whatsapp_url"
    t.boolean "whatsapp_enabled"
    t.index ["featured"], name: "index_companies_on_featured_true", where: "featured = true /*application:RailsBlogDemo*/ /*application:RailsBlogDemo*/"
    t.index ["project_types"], name: "index_companies_on_project_types"
    t.index ["services_offered"], name: "index_companies_on_services_offered"
    t.index ["state", "city"], name: "index_companies_on_state_and_city"
    t.index ["verified"], name: "index_companies_on_verified_true", where: "verified = true /*application:RailsBlogDemo*/ /*application:RailsBlogDemo*/"
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

  create_table "feature_groups", force: :cascade do |t|
    t.string "name"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
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

  create_table "leads", force: :cascade do |t|
    t.string "name"
    t.string "email"
    t.string "phone"
    t.string "company"
    t.text "message"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.integer "company_id"
    t.index ["company_id"], name: "index_leads_on_company_id"
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

  create_table "products", force: :cascade do |t|
    t.string "name"
    t.text "description"
    t.decimal "price", precision: 12, scale: 2
    t.integer "company_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.text "short_description"
    t.string "sku"
    t.integer "stock"
    t.string "status"
    t.boolean "featured", default: false
    t.string "seo_title"
    t.text "seo_description"
    t.index ["company_id"], name: "index_products_on_company_id"
    t.index ["sku"], name: "index_products_on_sku", unique: true
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
    t.index ["company_id", "created_at"], name: "index_reviews_on_company_id_and_created_at"
    t.index ["company_id", "user_id"], name: "index_reviews_on_company_id_and_user_id", unique: true
    t.index ["company_id"], name: "index_reviews_on_company_id"
    t.index ["user_id"], name: "index_reviews_on_user_id"
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
    t.string "role", default: "user"
    t.index ["confirmation_token"], name: "index_users_on_confirmation_token", unique: true
    t.index ["email"], name: "index_users_on_email", unique: true
    t.index ["provider", "uid"], name: "index_users_on_provider_and_uid"
    t.index ["reset_password_token"], name: "index_users_on_reset_password_token", unique: true
    t.index ["role"], name: "index_users_on_role"
  end

  add_foreign_key "active_storage_attachments", "active_storage_blobs", column: "blob_id"
  add_foreign_key "active_storage_variant_records", "active_storage_blobs", column: "blob_id"
  add_foreign_key "articles", "categories"
  add_foreign_key "articles", "products"
  add_foreign_key "badges", "categories"
  add_foreign_key "banners", "categories"
  add_foreign_key "campaign_reviews", "products"
  add_foreign_key "campaigns", "companies"
  add_foreign_key "categories_companies", "categories"
  add_foreign_key "categories_companies", "companies"
  add_foreign_key "categories_products", "categories"
  add_foreign_key "categories_products", "products"
  add_foreign_key "comments", "posts"
  add_foreign_key "comments", "users"
  add_foreign_key "forum_answers", "forum_questions"
  add_foreign_key "forum_answers", "users"
  add_foreign_key "forum_questions", "categories"
  add_foreign_key "forum_questions", "products"
  add_foreign_key "forum_questions", "users"
  add_foreign_key "leads", "companies"
  add_foreign_key "pending_changes", "admin_users", column: "approved_by_id"
  add_foreign_key "pending_changes", "companies"
  add_foreign_key "pending_changes", "users"
  add_foreign_key "posts", "users"
  add_foreign_key "pricings", "products"
  add_foreign_key "product_accesses", "products"
  add_foreign_key "product_accesses", "users"
  add_foreign_key "products", "companies"
  add_foreign_key "reviews", "companies"
  add_foreign_key "reviews", "users"
  add_foreign_key "sponsored_plans", "categories"
  add_foreign_key "sponsored_plans", "plans"
  add_foreign_key "sponsored_plans", "products"
  add_foreign_key "subscription_plans", "categories"
  add_foreign_key "subscription_plans", "plans"
  add_foreign_key "subscription_plans", "products"
end
