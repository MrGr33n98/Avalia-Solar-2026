class CreateBadges < ActiveRecord::Migration[7.0]
  def change
    create_table :badges do |t|
      t.string :name
      t.text :description
      t.integer :position
      t.integer :year
      t.string :edition
      t.references :category, null: false, foreign_key: true
      t.string :products
      t.string :image

      t.timestamps
    end
  end
end
