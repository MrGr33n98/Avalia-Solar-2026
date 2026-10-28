# frozen_string_literal: true

class AddDurationAndStatusToSalesActivities < ActiveRecord::Migration[7.0]
  def change
    add_column :sales_activities, :duration_seconds, :integer
    add_column :sales_activities, :log_status, :string, default: 'completed', null: false

    add_index :sales_activities, %i[occurred_at activity_type], name: 'index_sales_activities_on_occurred_at_and_type'
    add_index :sales_activities, :log_status, name: 'index_sales_activities_on_log_status'
  end
end
