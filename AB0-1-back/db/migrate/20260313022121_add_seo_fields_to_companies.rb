class AddSeoFieldsToCompanies < ActiveRecord::Migration[7.0]
  def change
    add_column :companies, :seo_title, :string
    add_column :companies, :meta_description, :text
    
    add_index :companies, :seo_title
  end
end
