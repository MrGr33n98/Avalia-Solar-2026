class AddCriticalIndexes < ActiveRecord::Migration[7.0]
  disable_ddl_transaction!

  def change
    is_pg = ActiveRecord::Base.connection.adapter_name =~ /postgre/i

    # Busca por CNPJ
    add_index_safe :companies, :cnpj, unique: true, where: "cnpj IS NOT NULL", is_pg: is_pg
    # Busca por API key
    add_index_safe :companies, :api_key, unique: true, where: "api_key IS NOT NULL", is_pg: is_pg
    # Dashboard stats
    add_index_safe :leads, [:company_id, :created_at], order: { created_at: :desc }, is_pg: is_pg
    add_index_safe :reviews, [:company_id, :rating], order: { rating: :desc }, is_pg: is_pg
    # Analytics
    add_index_safe :analytics_events, [:company_id, :created_at], order: { created_at: :desc }, name: :idx_analytics_company_time, is_pg: is_pg
    # Member validation
    add_index_safe :company_members, [:company_id, :user_id], unique: true, is_pg: is_pg
  end

  private

  def add_index_safe(table_name, column_name, is_pg:, **options)
    options[:if_not_exists] = true
    options[:algorithm] = :concurrently if is_pg
    add_index table_name, column_name, **options
  end
end
