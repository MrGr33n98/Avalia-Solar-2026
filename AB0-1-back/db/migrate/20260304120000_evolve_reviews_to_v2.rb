class EvolveReviewsToV2 < ActiveRecord::Migration[7.0]
  def change
    add_column :reviews, :headline, :string
    add_column :reviews, :project_type, :integer
    add_column :reviews, :installation_status, :integer
    add_column :reviews, :estimated_power, :decimal, precision: 10, scale: 2
    add_column :reviews, :is_legacy, :boolean, default: true, null: false
    add_column :reviews, :content_metadata, :jsonb, default: {}, null: false
    add_column :reviews, :metadata, :jsonb, default: {}, null: false

    add_index :reviews, :content_metadata, using: :gin
    add_index :reviews, :metadata, using: :gin
    add_index :reviews, :project_type
    add_index :reviews, :installation_status
  end
end
