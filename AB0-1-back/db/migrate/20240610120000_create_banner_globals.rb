class CreateBannerGlobals < ActiveRecord::Migration[7.0]
  def change
    create_table :banner_globals do |t|
      t.string :title, null: false
      t.string :link, null: false
      t.timestamps
    end
  end
end