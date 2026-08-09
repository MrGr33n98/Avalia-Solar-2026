class AddScoringToChatLeads < ActiveRecord::Migration[7.0]
  def change
    add_column :chat_leads, :intent_score, :integer, default: 0
    add_column :chat_leads, :fit_score, :integer, default: 0
    add_column :chat_leads, :score_explanation, :jsonb, default: {}
  end
end
