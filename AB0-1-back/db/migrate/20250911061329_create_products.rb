class CreateProducts < ActiveRecord::Migration[7.0]
  def change
    # Only create products table, assuming companies table already exists
    create_table :products do |t|
      t.string :name
      t.text :description
      t.decimal :price
      t.references :company, foreign_key: true
      t.timestamps
    end
  end
end
