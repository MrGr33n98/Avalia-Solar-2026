# frozen_string_literal: true

class CreateCompanyProposalSettings < ActiveRecord::Migration[7.0]
  def change
    create_table :company_proposal_settings do |t|
      t.references :company, null: false, foreign_key: true, index: { unique: true }
      t.string :default_model, default: 'modelo_1', null: false
      t.jsonb :pdf_colors, default: { primary: '#0066FF', secondary: '#0F172A', accent: '#F6E85A' }, null: false
      t.string :cover_mode, default: 'solar_ceu', null: false
      t.string :cover_image_url
      t.jsonb :sections_config, default: [], null: false
      t.jsonb :pricing_tiers, default: [], null: false
      t.jsonb :payment_conditions, default: [], null: false
      t.jsonb :digital_sections, default: [], null: false
      t.jsonb :custom_form_fields, default: [], null: false

      t.timestamps
    end
  end
end
