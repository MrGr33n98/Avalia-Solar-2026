class AddRansackIndexes < ActiveRecord::Migration[7.0]
  disable_ddl_transaction!

  def change
    # Filters mais comuns no MaxPanel
    add_index :companies, [:status, :active_admin], algorithm: :concurrently, if_not_exists: true
    add_index :companies, [:sector_rating_avg], where: "sector_rating_avg IS NOT NULL", algorithm: :concurrently, if_not_exists: true
    add_index :companies, [:priority_score], where: "priority_score IS NOT NULL", algorithm: :concurrently, if_not_exists: true

    # Relacionamentos frequentes
    add_index :campaigns, [:company_id], algorithm: :concurrently, if_not_exists: true
    add_index :leads, [:company_id, :wizard_status, :created_at], algorithm: :concurrently, if_not_exists: true
  end
end
