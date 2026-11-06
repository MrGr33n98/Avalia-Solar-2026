# frozen_string_literal: true

class AddEditorialWorkflowAndRevisionsToCategories < ActiveRecord::Migration[7.0]
  def change
    add_column :categories, :lock_version, :integer, default: 0, null: false unless column_exists?(:categories, :lock_version)
    add_column :categories, :editorial_status, :string, default: 'published', null: false unless column_exists?(:categories, :editorial_status)
    add_column :categories, :published_at, :datetime unless column_exists?(:categories, :published_at)
    add_column :categories, :published_by_id, :bigint unless column_exists?(:categories, :published_by_id)

    create_table :category_editorial_revisions, if_not_exists: true do |t|
      t.references :category, null: false, foreign_key: true
      t.integer :version_number, null: false
      t.string :status, null: false, default: 'draft'
      t.jsonb :payload_json, null: false, default: {}
      t.text :source_notes
      t.string :change_reason
      t.bigint :created_by_id
      t.bigint :reviewed_by_id
      t.datetime :published_at
      t.timestamps
    end

    add_index :category_editorial_revisions, %i[category_id version_number],
              unique: true,
              name: 'idx_category_editorial_revisions_cat_version',
              if_not_exists: true
    add_index :category_editorial_revisions, %i[category_id status],
              name: 'idx_category_editorial_revisions_cat_status',
              if_not_exists: true
  end
end
