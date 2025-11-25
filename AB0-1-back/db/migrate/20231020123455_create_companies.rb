class CreateCompanies < ActiveRecord::Migration[7.0]
  def change
    # Verifica se a tabela já existe antes de tentar criá-la
    unless table_exists?(:companies)
      create_table :companies do |t|
        t.string :name
        t.text :description
        t.string :website
        t.string :phone
        t.text :address

        t.timestamps
      end
    end
  end
end