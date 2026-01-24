class AddFinancingModels < ActiveRecord::Migration[7.0]
  def change
    add_column :companies, :financing_enabled, :boolean, null: false, default: false

    create_table :company_financing_profiles do |t|
      t.references :company, null: false, foreign_key: true, index: { unique: true }
      t.string :title
      t.string :subtitle
      t.text :disclaimer
      t.string :cta_label
      t.string :cta_url
      t.string :currency, default: 'BRL'

      t.integer :default_amount_cents
      t.integer :min_amount_cents
      t.integer :max_amount_cents

      t.decimal :default_down_payment_percent, precision: 5, scale: 2
      t.decimal :min_down_payment_percent, precision: 5, scale: 2
      t.decimal :max_down_payment_percent, precision: 5, scale: 2

      t.integer :default_term_months
      t.integer :min_term_months
      t.integer :max_term_months

      t.decimal :default_interest_rate_monthly, precision: 8, scale: 4
      t.decimal :min_interest_rate_monthly, precision: 8, scale: 4
      t.decimal :max_interest_rate_monthly, precision: 8, scale: 4

      t.boolean :grace_months_enabled, default: false, null: false
      t.integer :max_grace_months
      t.string :amortization_type, default: 'price'
      t.boolean :show_bank_logos, default: true, null: false
      t.boolean :show_fee_inputs, default: false, null: false
      t.string :status, default: 'draft', null: false

      t.timestamps
    end

    create_table :company_financing_partners do |t|
      t.references :company, null: false, foreign_key: true
      t.string :name, null: false
      t.string :partner_type
      t.string :website
      t.integer :priority, default: 0, null: false
      t.integer :position, default: 0, null: false
      t.boolean :active, default: true, null: false
      t.string :badge

      t.timestamps
    end

    add_index :company_financing_partners, [:company_id, :position]
    add_index :company_financing_partners, [:company_id, :priority]

    create_table :company_financing_offers do |t|
      t.references :company, null: false, foreign_key: true
      t.string :name, null: false
      t.string :offer_type
      t.integer :term_months
      t.decimal :interest_rate_monthly, precision: 8, scale: 4
      t.decimal :min_down_payment_percent, precision: 5, scale: 2
      t.integer :grace_months
      t.string :amortization_type
      t.text :notes
      t.boolean :active, default: true, null: false
      t.integer :position, default: 0, null: false

      t.timestamps
    end

    add_index :company_financing_offers, [:company_id, :position]
    add_index :company_financing_offers, [:company_id, :active]
  end
end
