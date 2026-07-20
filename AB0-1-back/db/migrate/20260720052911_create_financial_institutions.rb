class CreateFinancialInstitutions < ActiveRecord::Migration[7.0]
  def change
    create_table :financial_institutions do |t|
      t.string :name, null: false
      t.string :slug, null: false
      t.string :short_name
      t.string :official_url
      t.boolean :active, default: true, null: false
      t.integer :display_order, default: 0, null: false
      t.boolean :featured, default: false, null: false

      t.timestamps
    end
    add_index :financial_institutions, :slug, unique: true
  end
end
