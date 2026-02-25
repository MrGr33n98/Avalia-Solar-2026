class CreateExternalTariffsCache < ActiveRecord::Migration[7.0]
  def change
    create_table :external_tariffs_caches do |t|
      t.string :cep_prefix
      t.string :distributor
      t.decimal :tariff_kwh, precision: 10, scale: 6

      t.timestamps
    end
    add_index :external_tariffs_caches, :cep_prefix
  end
end
