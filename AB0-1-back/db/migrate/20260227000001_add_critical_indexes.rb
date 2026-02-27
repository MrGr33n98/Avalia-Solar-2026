class AddCriticalIndexes < ActiveRecord::Migration[7.0]
  disable_ddl_transaction!

  def change
    # Skip duplicate cleanup - data quality issues should be handled separately
    # This migration ONLY creates indexes for performance

    # Busca por CNPJ (autenticação SolarData/integração)
    add_index :companies, :cnpj, unique: true, where: "cnpj IS NOT NULL", algorithm: :concurrently, if_not_exists: true

    # Busca por API key (endpoints autenticados)
    add_index :companies, :api_key, unique: true, where: "api_key IS NOT NULL", algorithm: :concurrently, if_not_exists: true

    # Dashboard stats (leads count/avg rating)
    add_index :leads, [:company_id, :created_at], order: { created_at: :desc }, algorithm: :concurrently, if_not_exists: true
    add_index :reviews, [:company_id, :rating], order: { rating: :desc }, algorithm: :concurrently, if_not_exists: true

    # Analytics (telemetria do dashboard)
    add_index :analytics_events, 
      [:company_id, :created_at], 
      order: { created_at: :desc },
      name: :idx_analytics_company_time,
      algorithm: :concurrently,
      if_not_exists: true

    # Member validation (prevents N+1)
    add_index :company_members, [:company_id, :user_id], unique: true, algorithm: :concurrently, if_not_exists: true

    # External cache dedup
    add_index :external_tariffs_caches, [:company_id, :cache_key], unique: true, algorithm: :concurrently, if_not_exists: true
  end
end
