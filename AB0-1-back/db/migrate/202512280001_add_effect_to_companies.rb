class AddEffectToCompanies < ActiveRecord::Migration[7.0]
  def change
    unless column_exists?(:companies, :effect)
      add_column :companies, :effect, :boolean, null: false, default: false
      add_index :companies, :effect
    end
  end
end
