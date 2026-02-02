class CreateProductSpecifications < ActiveRecord::Migration[7.0]
  def change
    return if table_exists?(:product_specifications)

    create_table :product_specifications do |t|
      t.references :product,       null: false, foreign_key: true
      t.references :spec_template, null: false, foreign_key: { to_table: :spec_templates }

      t.string  :value_string
      t.decimal :value_number, precision: 20, scale: 6
      t.boolean :value_boolean
      t.json    :value_json
      t.string  :value_unit

      t.timestamps
    end

    add_index :product_specifications,
              [:product_id, :spec_template_id],
              unique: true,
              name: :idx_product_specifications_product_template

    add_index :product_specifications,
              :value_number,
              name: :idx_product_specifications_value_number
  end
end
