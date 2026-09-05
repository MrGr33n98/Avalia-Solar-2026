# frozen_string_literal: true

class AddIndexesToSalesCampaigns < ActiveRecord::Migration[7.0]
  def change
    unless index_exists?(:sales_campaigns, [:company_id, :created_at])
      add_index :sales_campaigns, [:company_id, :created_at], order: { created_at: :desc }, name: 'index_sales_campaigns_on_company_id_and_created_at'
    end

    unless index_exists?(:sales_campaigns, [:company_id, :status])
      add_index :sales_campaigns, [:company_id, :status], name: 'index_sales_campaigns_on_company_id_and_status'
    end
  end
end
