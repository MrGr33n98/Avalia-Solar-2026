class CreateCategorySolutionTypes < ActiveRecord::Migration[7.0]
  def change
    create_table :category_solution_types do |t|
      t.references :category,
              null: false,
              foreign_key: true,
              index: { name: 'idx_cst_category' }
      t.string :name, null: false
      t.string :slug, null: false
      t.text :short_description
      t.text :description
      t.string :visual_key
      t.string :technology_family
      t.string :speed_class
      t.integer :position, null: false, default: 100
      t.boolean :active, null: false, default: true
      t.boolean :featured, null: false, default: false
      t.jsonb :attributes_json, null: false, default: {}
      t.jsonb :use_cases, null: false, default: []
      t.timestamps
    end

    add_index :category_solution_types,
          %i[category_id slug],
          unique: true,
          name: 'idx_cst_category_slug'
    add_index :category_solution_types,
          %i[category_id active position],
          name: 'idx_cst_category_active_pos'
  end
end
