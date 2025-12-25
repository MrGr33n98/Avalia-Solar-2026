class AddCompanyIdToBanners < ActiveRecord::Migration[7.0]
  def change
    return unless table_exists?(:banners)
    return unless table_exists?(:companies)

    unless column_exists?(:banners, :company_id)
      add_reference :banners, :company, null: true, foreign_key: true
      add_index :banners, :company_id unless index_exists?(:banners, :company_id)
    end
  end
end
