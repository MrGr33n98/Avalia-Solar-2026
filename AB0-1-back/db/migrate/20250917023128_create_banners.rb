class CreateBanners < ActiveRecord::Migration[7.0]
  def change
    create_table :banners do |t|
      t.string :title
      t.string :image_url
      t.string :link
      t.boolean :active

      t.timestamps
    end
  end
end
