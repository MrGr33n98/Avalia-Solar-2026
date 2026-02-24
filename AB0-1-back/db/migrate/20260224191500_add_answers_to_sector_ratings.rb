class AddAnswersToSectorRatings < ActiveRecord::Migration[7.0]
  def change
    add_column :sector_ratings, :answers, :jsonb, default: {}, null: false
    add_index :sector_ratings, :answers, using: :gin
  end
end
