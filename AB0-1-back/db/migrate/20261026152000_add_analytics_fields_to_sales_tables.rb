# frozen_string_literal: true

class AddAnalyticsFieldsToSalesTables < ActiveRecord::Migration[7.0]
  def change
    add_column :sales_opportunity_competitors, :won_against, :boolean, default: false, null: false
    add_column :sales_opportunity_competitors, :lost_to, :boolean, default: false, null: false

    add_reference :sales_stage_histories, :company, foreign_key: true, index: true
  end
end
