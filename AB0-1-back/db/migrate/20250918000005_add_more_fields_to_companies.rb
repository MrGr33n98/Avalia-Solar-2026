class AddMoreFieldsToCompanies < ActiveRecord::Migration[7.0]
  def change
    unless column_exists?(:companies, :social_media)
      add_column :companies, :social_media, :jsonb, default: {}
    end
  end
end