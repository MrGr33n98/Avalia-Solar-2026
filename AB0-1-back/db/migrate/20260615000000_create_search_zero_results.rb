# frozen_string_literal: true

class CreateSearchZeroResults < ActiveRecord::Migration[7.0]
  def change
    create_table :search_zero_results do |t|
      t.string :query, null: false
      t.integer :category_id
      t.string :state
      t.string :city
      t.string :search_type, default: 'opensearch'

      t.timestamps
    end

    add_index :search_zero_results, :query
    add_index :search_zero_results, :created_at
  end
end
