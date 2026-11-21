# frozen_string_literal: true

class CreateCompanyAiAssistants < ActiveRecord::Migration[7.0]
  def change
    create_table :company_ai_assistants do |t|
      t.references :company, null: false, index: { unique: true }, foreign_key: true
      t.boolean :enabled, null: false, default: false
      t.string :timezone, null: false, default: 'America/Sao_Paulo'
      t.string :greeting, null: false, default: 'Olá! Como posso ajudar?'
      t.jsonb :weekly_hours, null: false, default: {}
      t.jsonb :exceptions, null: false, default: {}
      t.bigint :active_version_id
      t.timestamps
    end

    create_table :company_ai_workflow_versions do |t|
      t.references :company_ai_assistant, null: false, foreign_key: true, index: { name: 'idx_company_ai_versions_owner' }
      t.integer :version_number, null: false
      t.string :status, null: false, default: 'draft'
      t.jsonb :definition, null: false, default: {}
      t.datetime :published_at
      t.bigint :created_by_id
      t.timestamps
    end
    add_index :company_ai_workflow_versions, %i[company_ai_assistant_id version_number],
              unique: true, name: 'idx_company_ai_versions_number'
    add_index :company_ai_workflow_versions, :company_ai_assistant_id,
              unique: true, where: "status = 'published'", name: 'idx_company_ai_one_published'
    add_foreign_key :company_ai_assistants, :company_ai_workflow_versions,
                    column: :active_version_id, name: 'fk_company_ai_active_version'

    create_table :company_ai_audit_events do |t|
      t.references :company, null: false, foreign_key: true
      t.references :company_ai_assistant, null: false, foreign_key: true, index: { name: 'idx_company_ai_audit_assistant' }
      t.bigint :actor_user_id
      t.string :action, null: false
      t.bigint :workflow_version_id
      t.jsonb :metadata, null: false, default: {}
      t.timestamps
    end

    create_table :company_ai_usage_entries do |t|
      t.references :company, null: false, foreign_key: true
      t.string :request_id, null: false
      t.string :state, null: false, default: 'reserved'
      t.integer :input_tokens, null: false, default: 0
      t.integer :output_tokens, null: false, default: 0
      t.decimal :cost_usd, precision: 12, scale: 6, null: false, default: 0
      t.string :model
      t.datetime :settled_at
      t.timestamps
    end
    add_index :company_ai_usage_entries, :request_id, unique: true, name: 'idx_company_ai_usage_idempotency'
    add_check_constraint :company_ai_usage_entries,
                         'input_tokens >= 0 AND output_tokens >= 0 AND cost_usd >= 0',
                         name: 'company_ai_usage_nonnegative'
  end
end
