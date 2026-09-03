class CreateSalesTags < ActiveRecord::Migration[7.0]
  def change
    create_table :sales_tags do |t|
      t.references :company, foreign_key: true
      t.references :created_by, foreign_key: { to_table: :users }
      t.string :name, null: false
      t.string :normalized_name, null: false
      t.string :slug, null: false
      t.string :color, null: false, default: '#2563eb'
      t.text :description
      t.string :entity_type, null: false, default: 'Opportunity'
      t.datetime :archived_at
      t.timestamps
    end
    add_index :sales_tags, %i[company_id entity_type normalized_name], unique: true, name: 'idx_sales_tags_unique_name'
    add_index :sales_tags, %i[company_id entity_type archived_at], name: 'idx_sales_tags_scope'
    create_table :sales_taggings do |t|
      t.references :sales_tag, null: false, foreign_key: true
      t.references :taggable, polymorphic: true, null: false
      t.references :created_by, foreign_key: { to_table: :users }
      t.timestamps
    end
    add_index :sales_taggings, %i[sales_tag_id taggable_type taggable_id], unique: true, name: 'idx_sales_taggings_unique'
  end
end
