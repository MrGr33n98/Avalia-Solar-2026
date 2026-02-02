class CreateSpecTemplates < ActiveRecord::Migration[7.0]
  def change
    return if table_exists?(:spec_templates)

    create_table :spec_templates do |t|
      t.string  :product_type, null: false              # ex: "solar.painel", "ev.wallbox"
      t.string  :key,          null: false              # snake_case identifier
      t.string  :label,        null: false
      t.string  :value_type,   null: false              # decimal | integer | boolean | enum | string | range | json
      t.string  :unit
      t.json    :enum_values,  null: false, default: [] # only for enum types
      t.boolean :filterable,   null: false, default: false
      t.boolean :sortable,     null: false, default: false
      t.boolean :comparable,   null: false, default: false
      t.integer :seo_weight,   null: false, default: 0
      t.boolean :required,     null: false, default: false
      t.timestamps
    end

    add_index :spec_templates, [:product_type, :key], unique: true, name: :idx_spec_templates_product_type_key
    add_index :spec_templates, :filterable
    add_index :spec_templates, :comparable
  end
end
