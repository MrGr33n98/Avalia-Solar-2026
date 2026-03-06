class CreateSeoLandingPages < ActiveRecord::Migration[7.0]
  def change
    create_table :seo_landing_pages do |t|
      t.string :slug, null: false
      t.references :category, null: false, foreign_key: true
      t.string :city_name
      t.string :state_abbr
      t.jsonb :metadata_cache, default: {}

      t.timestamps
    end

    add_index :seo_landing_pages, :slug, unique: true
  end
end
