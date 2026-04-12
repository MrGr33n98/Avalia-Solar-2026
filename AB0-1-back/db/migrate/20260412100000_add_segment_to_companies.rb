class AddSegmentToCompanies < ActiveRecord::Migration[7.0]
  def change
    add_column :companies, :segment, :string, default: 'installer', null: false

    add_index :companies, :segment

    # Empresas já existentes = instaladores (comportamento atual do www.)
    Company.reset_column_information
    Company.update_all(segment: 'installer')
  end
end
