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

        t.datetime :start_date
        t.datetime :end_date

        t.timestamps
      end

      # Adições condicionais para colunas que podem vir de migrações anteriores
      add_column :banners, :sponsored, :boolean, default: false unless column_exists?(:banners, :sponsored)
      add_column :banners, :banner_type, :string unless column_exists?(:banners, :banner_type)
      add_column :banners, :position, :string unless column_exists?(:banners, :position)

      # Adiciona foreign key apenas se a tabela categories já existir
      if table_exists?(:categories)
        add_reference :banners, :category, foreign_key: true, null: true unless column_exists?(:banners, :category_id)
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