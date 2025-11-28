class AddScheduleToBanners < ActiveRecord::Migration[7.0]
  def up
    if table_exists?(:banners)
      add_column :banners, :start_date, :datetime unless column_exists?(:banners, :start_date)
      add_column :banners, :end_date, :datetime unless column_exists?(:banners, :end_date)
      add_index :banners, :start_date unless index_exists?(:banners, :start_date)
      add_index :banners, :end_date unless index_exists?(:banners, :end_date)
    else
      create_table :banners do |t|
        t.string :title
        t.string :image_url
        t.string :link
        t.boolean :active, default: false

        t.references :category, foreign_key: true, null: true
        t.boolean :sponsored, default: false
        t.string :banner_type
        t.string :position

        t.datetime :start_date
        t.datetime :end_date

        t.timestamps
      end

      add_index :banners, :start_date unless index_exists?(:banners, :start_date)
      add_index :banners, :end_date unless index_exists?(:banners, :end_date)
    end
  end

  def down
    return unless table_exists?(:banners)

    remove_index :banners, :start_date if index_exists?(:banners, :start_date)
    remove_index :banners, :end_date if index_exists?(:banners, :end_date)
    remove_column :banners, :start_date if column_exists?(:banners, :start_date)
    remove_column :banners, :end_date if column_exists?(:banners, :end_date)
  end
end
