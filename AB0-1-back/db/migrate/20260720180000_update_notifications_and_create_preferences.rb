# frozen_string_literal: true

class UpdateNotificationsAndCreatePreferences < ActiveRecord::Migration[7.0]
  def change
    # Adiciona colunas extras para a Central de Notificações
    change_table :notifications, bulk: true do |t|
      t.datetime :archived_at
      t.string :category, default: 'system'
      t.string :actionable_type
      t.bigint :actionable_id
      t.bigint :company_id
      t.bigint :quote_request_id
      t.bigint :conversation_id
      t.bigint :review_id
      t.jsonb :metadata_json, default: {}
    end

    add_index :notifications, :archived_at
    add_index :notifications, :category
    add_index :notifications, [:user_id, :archived_at]
    add_index :notifications, [:user_id, :category]

    # Criar tabela de preferências de notificação
    create_table :notification_preferences do |t|
      t.references :user, null: false, foreign_key: { on_delete: :cascade }
      t.string :event_type, null: false
      t.boolean :in_app_enabled, default: true, null: false
      t.boolean :email_enabled, default: true, null: false
      t.boolean :push_enabled, default: true, null: false
      t.boolean :whatsapp_enabled, default: false, null: false
      t.string :frequency, default: 'immediately', null: false
      t.string :consent_version
      t.datetime :consented_at

      t.timestamps
    end

    add_index :notification_preferences, [:user_id, :event_type], unique: true
  end
end
