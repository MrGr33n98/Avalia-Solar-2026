class AddEmailTrackingFlags < ActiveRecord::Migration[7.0]
  def change
    add_column :sales_email_messages, :open_tracking_enabled, :boolean, default: true, null: false unless column_exists?(:sales_email_messages, :open_tracking_enabled)
    add_column :sales_email_messages, :click_tracking_enabled, :boolean, default: true, null: false unless column_exists?(:sales_email_messages, :click_tracking_enabled)
  end
end
