# frozen_string_literal: true

class CreateCompanyIcpProfiles < ActiveRecord::Migration[7.1]
  def change
    create_table :company_icp_profiles do |t|
      t.references :company, null: false, foreign_key: true, index: { unique: true }

      # Perfil Financeiro & Consumo (Solar + EV)
      t.decimal :min_monthly_bill, precision: 10, scale: 2, default: 500.00
      t.decimal :max_monthly_bill, precision: 10, scale: 2
      t.decimal :min_system_kwp, precision: 6, scale: 2, default: 3.00
      t.integer :min_ev_chargers_count, default: 1

      # Segmentos & Estruturas Solar/EV (JSONB Array)
      t.jsonb :target_audiences, default: ['PF', 'PJ']
      t.jsonb :preferred_roof_types, default: ['colonial', 'metalico', 'laje']
      t.jsonb :ev_charger_types, default: ['ac_wallbox', 'dc_fast_charger']

      # Abrangência Geográfica
      t.jsonb :target_cities, default: []
      t.jsonb :target_states, default: []
      t.boolean :nationwide, default: false

      # Rigor do Filtro & Automações
      t.string :strictness_level, default: 'balanced'
      t.boolean :auto_reject_out_of_icp, default: false
      t.boolean :notify_only_high_match, default: true

      t.timestamps
    end

    add_index :company_icp_profiles, :target_cities, using: :gin
    add_index :company_icp_profiles, :target_states, using: :gin
    add_index :company_icp_profiles, :preferred_roof_types, using: :gin
    add_index :company_icp_profiles, :ev_charger_types, using: :gin
  end
end
