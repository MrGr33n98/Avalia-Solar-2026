class CreateSalesForms < ActiveRecord::Migration[7.0]
  def change
    create_table :sales_forms do |t|
      t.references :company, foreign_key: true
      t.references :campaign, foreign_key: { to_table: :sales_campaigns }
      t.string :name, null: false
      t.string :slug, null: false
      t.boolean :active, null: false, default: true
      t.jsonb :fields, null: false, default: []
      t.timestamps
    end
    add_index :sales_forms, %i[company_id slug], unique: true

    create_table :sales_form_submissions do |t|
      t.references :form, null: false, foreign_key: { to_table: :sales_forms }
      t.references :account, foreign_key: { to_table: :sales_accounts }
      t.references :contact, foreign_key: { to_table: :sales_contacts }
      t.references :campaign, foreign_key: { to_table: :sales_campaigns }
      t.string :idempotency_key, null: false
      t.jsonb :payload, null: false, default: {}
      t.string :status, null: false, default: 'received'
      t.timestamps
    end
    add_index :sales_form_submissions, :idempotency_key, unique: true
  end
end
