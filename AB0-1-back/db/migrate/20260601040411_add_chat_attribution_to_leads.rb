# frozen_string_literal: true

class AddChatAttributionToLeads < ActiveRecord::Migration[7.0]
  def change
    change_table :leads, bulk: true do |t|
      # Relacionamentos com a sessão e lead do chat
      t.references :chat_lead, null: true, foreign_key: true
      t.references :chat_session, null: true, foreign_key: true
      t.string :source, default: 'portal', null: false
      
      # Informações de RAG e Interações
      t.jsonb :recommended_company_ids, default: [], null: false
      t.bigint :clicked_company_id, null: true
      t.bigint :quote_requested_company_id, null: true
      t.bigint :whatsapp_clicked_company_id, null: true
      t.jsonb :comparison_company_ids, default: [], null: false
      
      # Enriquecimento de IA e Contexto Comercial
      t.string :intent_type
      t.string :vertical
      t.string :qualification_level
      t.integer :lead_score
      t.text :ai_summary
      t.string :next_best_action
      t.text :initial_question
      t.text :last_user_message
      t.string :source_page_url
      
      # LGPD Auditoria
      t.string :lgpd_consent_version
      t.datetime :lgpd_consent_at
      t.text :lgpd_consent_text
    end

    add_index :leads, :source
    add_index :leads, :clicked_company_id
    add_index :leads, :quote_requested_company_id
    add_index :leads, :recommended_company_ids, using: :gin
  end
end
