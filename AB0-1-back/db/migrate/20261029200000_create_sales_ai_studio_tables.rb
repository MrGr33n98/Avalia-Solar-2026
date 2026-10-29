# frozen_string_literal: true

class CreateSalesAiStudioTables < ActiveRecord::Migration[7.0]
  def change
    create_table :sales_ai_settings, if_not_exists: true do |t|
      t.references :company, null: false, foreign_key: true, index: { unique: true, name: 'idx_sales_ai_settings_company_unique' }
      t.string :provider, default: 'openrouter', null: false
      t.boolean :enabled, default: true, null: false
      t.text :openrouter_api_key_ciphertext
      t.string :openrouter_masked_key
      t.string :openrouter_key_status, default: 'unconfigured', null: false
      t.datetime :openrouter_key_rotated_at
      t.datetime :openrouter_last_tested_at
      t.integer :openrouter_last_latency_ms
      t.string :openrouter_last_error
      t.decimal :monthly_budget_usd, precision: 10, scale: 4, default: 50.0, null: false
      t.integer :daily_user_limit, default: 100, null: false
      t.boolean :fallback_enabled, default: true, null: false
      t.boolean :require_zdr, default: false, null: false
      t.jsonb :allowed_models, default: [], null: false
      t.jsonb :allowed_context_fields, default: [], null: false
      t.jsonb :policies, default: {}, null: false
      t.bigint :updated_by_user_id
      t.timestamps
    end

    create_table :sales_ai_model_profiles, if_not_exists: true do |t|
      t.references :company, null: false, foreign_key: true
      t.string :feature, null: false
      t.string :primary_model_id, null: false
      t.string :fallback_model_id
      t.decimal :temperature, precision: 3, scale: 2, default: 0.3, null: false
      t.integer :max_tokens, default: 1200, null: false
      t.boolean :enabled, default: true, null: false
      t.integer :quota_daily, default: 200, null: false
      t.timestamps
    end

    unless index_exists?(:sales_ai_model_profiles, %i[company_id feature], name: 'idx_sales_ai_profiles_company_feature')
      add_index :sales_ai_model_profiles,
                %i[company_id feature],
                unique: true,
                name: 'idx_sales_ai_profiles_company_feature'
    end

    create_table :sales_ai_generations, if_not_exists: true do |t|
      t.references :company, null: false, foreign_key: true
      t.references :user, null: false, foreign_key: true
      t.string :feature, null: false
      t.string :action_name, null: false
      t.string :provider, default: 'openrouter', null: false
      t.string :requested_model, null: false
      t.string :resolved_model
      t.string :fallback_model_used
      t.string :prompt_version, default: 'crm-ai-v1', null: false
      t.string :status, default: 'completed', null: false
      t.string :idempotency_key
      t.jsonb :context_refs, default: {}, null: false
      t.jsonb :sources_used, default: [], null: false
      t.jsonb :missing_fields, default: [], null: false
      t.jsonb :warnings, default: [], null: false
      t.jsonb :output_json, default: {}, null: false
      t.integer :prompt_tokens, default: 0, null: false
      t.integer :completion_tokens, default: 0, null: false
      t.decimal :estimated_cost_usd, precision: 12, scale: 6, default: 0.0, null: false
      t.integer :latency_ms, default: 0, null: false
      t.string :error_code
      t.string :error_message
      t.string :user_decision
      t.string :user_feedback_notes
      t.timestamps
    end

    unless index_exists?(:sales_ai_generations, %i[company_id user_id created_at], name: 'idx_sales_ai_generations_audit')
      add_index :sales_ai_generations,
                %i[company_id user_id created_at],
                name: 'idx_sales_ai_generations_audit'
    end

    unless index_exists?(:sales_ai_generations, %i[company_id user_id idempotency_key], name: 'idx_sales_ai_generations_idempotency')
      add_index :sales_ai_generations,
                %i[company_id user_id idempotency_key],
                unique: true,
                where: 'idempotency_key IS NOT NULL',
                name: 'idx_sales_ai_generations_idempotency'
    end
  end
end
