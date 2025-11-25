class AddContactFieldsToCompanies < ActiveRecord::Migration[7.0]
  def change
    add_column :companies, :phone, :string unless column_exists?(:companies, :phone)
    add_column :companies, :website, :string unless column_exists?(:companies, :website)
    add_column :companies, :address, :string unless column_exists?(:companies, :address)
    add_column :companies, :phone_alt, :string unless column_exists?(:companies, :phone_alt)
    add_column :companies, :whatsapp, :string unless column_exists?(:companies, :whatsapp)
    add_column :companies, :email_public, :string unless column_exists?(:companies, :email_public)
  end
end