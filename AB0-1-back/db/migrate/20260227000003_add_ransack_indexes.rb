class AddRansackIndexes < ActiveRecord::Migration[7.0]
  disable_ddl_transaction!

  def change
    is_pg = ActiveRecord::Base.connection.adapter_name =~ /postgre/i

    # Filters mais comuns no MaxPanel
    add_index_safe :companies, [:status, :active_admin], is_pg: is_pg
    add_index_safe :companies, [:sector_rating_avg], where: "sector_rating_avg IS NOT NULL", is_pg: is_pg
    add_index_safe :companies, [:priority_score], where: "priority_score IS NOT NULL", is_pg: is_pg

    # Relacionamentos frequentes
    add_index_safe :campaigns, [:company_id], is_pg: is_pg
    add_index_safe :leads, [:company_id, :wizard_status, :created_at], is_pg: is_pg
  end

  private

  def add_index_safe(table_name, column_name, is_pg:, **options)
    options[:if_not_exists] = true
    options[:algorithm] = :concurrently if is_pg
    add_index table_name, column_name, **options
  end
end
