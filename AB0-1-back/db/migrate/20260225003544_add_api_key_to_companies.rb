class AddApiKeyToCompanies < ActiveRecord::Migration[7.0]
  def change
    add_column :companies, :api_key, :string
    add_index :companies, :api_key
    add_column :companies, :trust_score, :decimal
  end
end
