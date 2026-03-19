class CreateBrandsAndAddBrandToProducts < ActiveRecord::Migration[7.0]
  def change
    unless table_exists?(:brands)
      create_table :brands do |t|
        t.string :name, null: false
        t.string :slug, null: false
        t.jsonb :aliases, null: false, default: []
        t.string :status, null: false, default: 'active'
        t.timestamps
      end

      add_index :brands, :slug, unique: true
      add_index :brands, :status
    end

    return if column_exists?(:products, :brand_id)

    add_reference :products, :brand, foreign_key: true, index: true, null: true
  end
end
