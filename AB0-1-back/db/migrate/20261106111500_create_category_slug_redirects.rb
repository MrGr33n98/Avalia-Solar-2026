# frozen_string_literal: true

class CreateCategorySlugRedirects < ActiveRecord::Migration[7.0]
  def change
    create_table :category_slug_redirects do |t|
      t.references :category, null: false, foreign_key: { on_delete: :cascade }
      t.string :source_slug, null: false
      t.integer :http_status, null: false, default: 308
      t.string :reason
      t.bigint :created_by_id

      t.timestamps
    end

    add_index :category_slug_redirects, :source_slug, unique: true, name: 'index_category_slug_redirects_on_source_slug'
    add_index :category_slug_redirects, %i[category_id created_at], name: 'index_category_slug_redirects_on_category_and_created_at'
  end
end

