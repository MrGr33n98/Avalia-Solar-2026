# frozen_string_literal: true

class CreateChatLeads < ActiveRecord::Migration[7.0]
  def change
    create_table :chat_leads do |t|
      t.references :chat_session, null: false, foreign_key: true

      # Dados pessoais (LGPD)
      t.string :name
      t.string :email
      t.string :phone
      t.string :city
      t.string :state

      # Classificação comercial
      t.string :vertical # 'solar', 'electric_mobility'
      t.string :intent # 'solar_quote', 'ev_charger_installation', etc.
      t.string :project_type
      t.decimal :monthly_bill, precision: 10, scale: 2
      t.integer :vehicle_count
      t.string :solution_type
      t.string :budget_range
      t.string :urgency
      t.string :decision_timeline
      t.string :decision_role
      t.string :property_type
      t.string :company_size

      # Scoring
      t.integer :lead_score, default: 0, null: false
      t.string :lead_temperature, default: 'frio', null: false # frio, morno, quente, muito_quente
      t.string :sales_status, default: 'new', null: false # new, qualified, contacted, proposal_sent, converted, lost, spam

      # Atribuição
      t.bigint :assigned_to_id # admin_user que é dono
      t.bigint :assigned_company_id # empresa parceira atribuída

      # LGPD
      t.boolean :consent_given, default: false, null: false
      t.datetime :consent_given_at

      # Origem
      t.string :source_page
      t.string :utm_source
      t.string :utm_medium
      t.string :utm_campaign

      # Inteligência
      t.text :summary
      t.jsonb :pain_points, default: []
      t.jsonb :objections, default: []
      t.string :recommended_next_action

      t.jsonb :metadata, default: {}

      t.timestamps
    end

    add_index :chat_leads, :vertical
    add_index :chat_leads, :intent
    add_index :chat_leads, :lead_score
    add_index :chat_leads, :lead_temperature
    add_index :chat_leads, :sales_status
    add_index :chat_leads, :city
    add_index :chat_leads, :state
    add_index :chat_leads, :source_page
    add_index :chat_leads, :utm_source
    add_index :chat_leads, :utm_campaign
    add_index :chat_leads, :created_at
    add_index :chat_leads, :consent_given
    add_index :chat_leads, %i[vertical created_at]
    add_index :chat_leads, %i[sales_status created_at]
    add_index :chat_leads, %i[lead_temperature created_at]
  end
end
