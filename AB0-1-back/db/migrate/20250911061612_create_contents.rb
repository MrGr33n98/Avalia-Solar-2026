class CreateContents < ActiveRecord::Migration[7.0]
  def change
    create_table :contents do |t|
      t.string :title
      t.text :short_description
      t.string :tags
      t.string :landing_url
      t.string :format
      t.string :level

      t.timestamps
    end
  end
end
