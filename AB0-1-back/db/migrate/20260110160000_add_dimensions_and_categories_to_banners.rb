class AddDimensionsAndCategoriesToBanners < ActiveRecord::Migration[7.0]
  class MigrationBanner < ActiveRecord::Base
    self.table_name = 'banners'
  end

  def up
    return unless table_exists?(:banners)

    unless column_exists?(:banners, :width)
      add_column :banners, :width, :integer, null: true
    end

    unless column_exists?(:banners, :height)
      add_column :banners, :height, :integer, null: true
    end

    unless table_exists?(:banners_categories)
      create_table :banners_categories, id: false do |t|
        t.bigint :banner_id, null: false
        t.bigint :category_id, null: false
      end
    end

    unless index_exists?(:banners_categories, %i[banner_id category_id], unique: true, name: 'index_banners_categories_unique')
      add_index :banners_categories, %i[banner_id category_id], unique: true, name: 'index_banners_categories_unique'
    end
    add_index :banners_categories, :banner_id unless index_exists?(:banners_categories, :banner_id)
    add_index :banners_categories, :category_id unless index_exists?(:banners_categories, :category_id)

    if table_exists?(:categories)
      add_foreign_key :banners_categories, :banners unless foreign_key_exists?(:banners_categories, :banners)
      add_foreign_key :banners_categories, :categories unless foreign_key_exists?(:banners_categories, :categories)
    end

    backfill_banner_dimensions
    backfill_banner_categories
  end

  def down
    drop_table :banners_categories if table_exists?(:banners_categories)
    remove_column :banners, :width if column_exists?(:banners, :width)
    remove_column :banners, :height if column_exists?(:banners, :height)
  end

  private

  def backfill_banner_dimensions
    return unless column_exists?(:banners, :width) && column_exists?(:banners, :height)

    say_with_time 'Backfilling banner width/height (defaults = half of previous sizes)' do
      MigrationBanner.reset_column_information
      MigrationBanner.where(width: nil).or(MigrationBanner.where(height: nil)).find_each do |banner|
        width, height = default_dimensions_for_position(banner.position)
        banner.update_columns(width: width, height: height)
      end
    end
  end

  def default_dimensions_for_position(position)
    # Previous (legacy) sizes from scripts/docs:
    # - categories_top/home_top/companies_top: 1200x400
    # - navbar: 1920x200
    # - sidebar: 300x250
    #
    # New defaults = half.
    case position.to_s
    when 'navbar'
      [960, 100]
    when 'sidebar'
      [150, 125]
    else
      [600, 200]
    end
  end

  def backfill_banner_categories
    return unless table_exists?(:banners_categories)
    return unless column_exists?(:banners, :category_id)

    say_with_time 'Backfilling banners_categories from banners.category_id' do
      adapter = connection.adapter_name.to_s.downcase
      if adapter.include?('postgres')
        execute <<~SQL
          INSERT INTO banners_categories (banner_id, category_id)
          SELECT id AS banner_id, category_id
          FROM banners
          WHERE category_id IS NOT NULL
          ON CONFLICT DO NOTHING
        SQL
      else
        MigrationBanner.reset_column_information
        MigrationBanner.where.not(category_id: nil).find_each do |banner|
          execute <<~SQL.squish
            INSERT INTO banners_categories (banner_id, category_id)
            VALUES (#{banner.id}, #{banner.category_id})
          SQL
        rescue StandardError
          # ignore duplicates / unsupported errors on non-Postgres adapters
        end
      end
    end
  end
end

