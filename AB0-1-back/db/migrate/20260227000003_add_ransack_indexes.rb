class AddRansackIndexes < ActiveRecord::Migration[7.0]
  def change
    # Filters mais comuns no MaxPanel
    add_index :companies, [:status, :active_admin], algorithm: :concurrently
    add_index :companies, [:sector_rating_score], where: "sector_rating_score IS NOT NULL", algorithm: :concurrently
    add_index :companies, [:priority_score], where: "priority_score IS NOT NULL", algorithm: :concurrently

    # Relacionamentos frequentes
    add_index :campaigns, [:company_id, :status], algorithm: :concurrently
    add_index :leads, [:company_id, :status, :created_at], algorithm: :concurrently
  end
end
