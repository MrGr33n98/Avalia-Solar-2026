# frozen_string_literal: true

class CreateChatInsights < ActiveRecord::Migration[7.0]
  def change
    create_table :chat_insights do |t|
      t.string :insight_type, null: false # 'frequent_question', 'sales_objection', 'market_demand', etc.
      t.string :vertical
      t.string :city
      t.string :state
      t.string :title, null: false
      t.text :summary
      t.integer :volume, default: 1
      t.float :confidence_score
      t.date :source_period_start
      t.date :source_period_end

      t.jsonb :metadata, default: {}

      t.timestamps
    end

    add_index :chat_insights, :insight_type
    add_index :chat_insights, :vertical
    add_index :chat_insights, :city
    add_index :chat_insights, :state
    add_index :chat_insights, :created_at
    add_index :chat_insights, %i[insight_type vertical]
    add_index :chat_insights, %i[insight_type created_at]
  end
end
