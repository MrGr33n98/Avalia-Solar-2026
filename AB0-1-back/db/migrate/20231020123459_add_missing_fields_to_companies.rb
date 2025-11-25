class AddMissingFieldsToCompanies < ActiveRecord::Migration[7.0]
  def change
    # Basic company info
    add_column :companies, :cnpj, :string unless column_exists?(:companies, :cnpj)
    add_column :companies, :email, :string unless column_exists?(:companies, :email)
    
    # Social media
    add_column :companies, :instagram, :string unless column_exists?(:companies, :instagram)
    add_column :companies, :facebook, :string unless column_exists?(:companies, :facebook)
    add_column :companies, :linkedin, :string unless column_exists?(:companies, :linkedin)
    
    # Business info
    add_column :companies, :working_hours, :string unless column_exists?(:companies, :working_hours)
    add_column :companies, :payment_methods, :string unless column_exists?(:companies, :payment_methods)
    add_column :companies, :status, :string, default: 'active' unless column_exists?(:companies, :status)
    add_column :companies, :certifications, :text unless column_exists?(:companies, :certifications)
  end
end