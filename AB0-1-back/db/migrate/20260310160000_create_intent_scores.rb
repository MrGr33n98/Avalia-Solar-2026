class CreateIntentScores < ActiveRecord::Migration[7.0]
  def change
    enable_extension 'pgcrypto' unless extension_enabled?('pgcrypto')
    
    create_table :intent_scores, id: :uuid do |t|
      t.uuid     :company_id,            null: false
      t.uuid     :lead_id,               index: true
      t.string   :anonymous_id,          index: true
      t.string   :session_id

      # Score Principal
      t.integer  :total_score,           null: false, default: 0
      t.string   :intent_level,          null: false, default: 'cold'

      # Scores Parciais (por categoria)
      t.integer  :micro_interaction_score, default: 0
      t.integer  :financial_intent_score,  default: 0
      t.integer  :research_intent_score,   default: 0
      t.integer  :contact_intent_score,    default: 0

      # Contadores de Sinais
      t.integer  :total_signals_count,     default: 0
      t.integer  :hot_signals_count,       default: 0
      t.integer  :unique_sessions_count,   default: 1
      t.integer  :unique_pages_count,      default: 0

      # Timestamps de Comportamento
      t.datetime :first_interaction_at
      t.datetime :last_interaction_at
      t.datetime :last_hot_signal_at
      t.integer  :days_active,             default: 0

      # Decaimento e Calibração
      t.float    :decay_factor,            default: 1.0
      t.float    :position_bias_correction, default: 0.0
      t.float    :confidence_score,        default: 0.0
      t.string   :scoring_version,         default: 'v1'

      # Metadata
      t.jsonb    :score_breakdown,         default: {}
      t.jsonb    :top_signals,             default: []
      t.string   :recommended_action

      t.timestamps
    end

    add_index :intent_scores, :company_id
    add_index :intent_scores, :total_score
    add_index :intent_scores, :intent_level
    add_index :intent_scores, [:company_id, :lead_id], unique: true, where: 'lead_id IS NOT NULL', name: 'idx_scores_company_lead_unique'
    add_index :intent_scores, [:company_id, :anonymous_id], unique: true, where: 'anonymous_id IS NOT NULL', name: 'idx_scores_company_anon_unique'
    add_index :intent_scores, [:intent_level, :total_score], name: 'idx_scores_level_score'
    add_index :intent_scores, :last_interaction_at
    add_index :intent_scores, :score_breakdown, using: :gin

    add_foreign_key :intent_scores, :companies, column: :company_id
  end
end
