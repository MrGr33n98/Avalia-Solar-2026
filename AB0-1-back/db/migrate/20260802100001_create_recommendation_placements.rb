class CreateRecommendationPlacements < ActiveRecord::Migration[7.0]
  def change
    create_table :recommendation_placements do |t|
      t.references :company, null: false, foreign_key: { on_delete: :cascade }
      t.references :category, null: true, foreign_key: true
      t.string :placement_type, null: false, default: 'sponsored'
      t.string :state_code, limit: 2
      t.integer :slot_position, null: false, default: 1
      t.datetime :starts_at, null: false
      t.datetime :ends_at, null: false
      t.integer :max_impressions
      t.integer :current_impressions, null: false, default: 0
      t.boolean :active, null: false, default: true

      t.timestamps
    end

    add_index :recommendation_placements, [:active, :state_code, :category_id, :starts_at, :ends_at], name: 'idx_rec_placements_lookup'
    add_index :recommendation_placements, :placement_type
  end
end
