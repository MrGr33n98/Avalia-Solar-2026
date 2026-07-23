# frozen_string_literal: true

class CreateContentLeadExports < ActiveRecord::Migration[7.0]
  def change
    create_table :content_lead_exports do |t|
      t.references :company, null: false, foreign_key: true
      t.references :actor, null: false, foreign_key: { to_table: :users }
      t.jsonb :filters, null: false, default: {}
      t.integer :row_count, null: false, default: 0
      t.string :ip_hash
      t.string :user_agent_hash
      t.timestamps
    end

    add_index :content_lead_exports, %i[company_id created_at]
    add_index :content_lead_exports, %i[actor_id created_at]
  end
end
