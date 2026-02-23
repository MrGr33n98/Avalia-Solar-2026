class CreateSectorRatings < ActiveRecord::Migration[7.0]
  def change
    create_table :sector_ratings do |t|
      t.references :company, null: false, foreign_key: true
      t.references :user, null: false, foreign_key: true
      t.integer :homologation, null: false
      t.integer :technical_quality, null: false
      t.integer :safety, null: false
      t.integer :consultancy, null: false
      t.decimal :total_score, precision: 4, scale: 2
      t.string :status, default: 'draft', null: false
      t.text :comment

      t.timestamps
      t.index %i[company_id user_id], unique: true, name: 'index_sector_ratings_on_company_and_user'
    end
  end
end
