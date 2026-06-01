# frozen_string_literal: true

class CreateChatLeadActivities < ActiveRecord::Migration[7.0]
  def change
    create_table :chat_lead_activities do |t|
      t.references :chat_lead, null: false, foreign_key: true

      t.string :activity_type, null: false # 'status_change', 'note_added', 'assigned', 'contacted'
      t.text :description
      t.string :old_status
      t.string :new_status
      t.bigint :performed_by_id # admin_user que fez a ação

      t.jsonb :metadata, default: {}

      t.timestamps
    end

    add_index :chat_lead_activities, :activity_type
    add_index :chat_lead_activities, :created_at
  end
end
