class CreateCategories < ActiveRecord::Migration[7.0]
  def change
    create_table :categories do |t|
      t.string :name
      t.string :seo_url
      t.string :seo_title
      t.text :short_description
      t.text :description
      t.integer :parent_id
      t.string :kind
      t.string :status
      t.boolean :featured

      t.timestamps
    end
  end
end
