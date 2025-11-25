class AddMissingFieldsToCompaniesV3 < ActiveRecord::Migration[7.0]
  def change
    # Check if columns exist before adding them to prevent duplicates
    unless column_exists?(:companies, :cnpj)
      add_column :companies, :cnpj, :string
    end
    
    unless column_exists?(:companies, :email)
      add_column :companies, :email, :string
    end
    
    unless column_exists?(:companies, :instagram)
      add_column :companies, :instagram, :string
    end
    
    unless column_exists?(:companies, :facebook)
      add_column :companies, :facebook, :string
    end
    
    unless column_exists?(:companies, :linkedin)
      add_column :companies, :linkedin, :string
    end
    
    unless column_exists?(:companies, :working_hours)
      add_column :companies, :working_hours, :string
    end
    
    unless column_exists?(:companies, :payment_methods)
      add_column :companies, :payment_methods, :string
    end
    
    unless column_exists?(:companies, :status)
      add_column :companies, :status, :string, default: "active"
    end
    
    unless column_exists?(:companies, :certifications)
      add_column :companies, :certifications, :text
    end
  end
end