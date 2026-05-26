class AddPerformanceIndexesToDashboard < ActiveRecord::Migration[7.0]
  disable_ddl_transaction!

  def change
    add_index :companies, :created_at, algorithm: :concurrently, if_not_exists: true
    add_index :leads, :created_at, algorithm: :concurrently, if_not_exists: true
    add_index :reviews, :created_at, algorithm: :concurrently, if_not_exists: true
    
    # Adding combined indexes since queries filter by status AND created_at
    add_index :subscription_plans, [:status, :created_at], algorithm: :concurrently, if_not_exists: true
    add_index :banner_subscriptions, [:status, :created_at], algorithm: :concurrently, if_not_exists: true
  end
end
