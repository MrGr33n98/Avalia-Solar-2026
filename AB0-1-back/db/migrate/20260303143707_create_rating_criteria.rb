class CreateRatingCriteria < ActiveRecord::Migration[7.0]
  def change
    create_table :rating_criteria do |t|
      t.references :category, null: true, foreign_key: true
      t.string :slug, null: false
      t.string :title, null: false
      t.text :help_text
      t.integer :position, default: 0
      t.boolean :required, default: true
      t.boolean :allow_na, default: false
      t.boolean :active, default: true
      t.decimal :weight, precision: 3, scale: 2, default: 1.0

      t.timestamps
    end

    add_index :rating_criteria, [:category_id, :slug], unique: true
    add_index :rating_criteria, :slug
  end
end
