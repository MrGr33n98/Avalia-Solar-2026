# frozen_string_literal: true

class AddTwoFactorToAdminUsers < ActiveRecord::Migration[7.0]
  def change
    # CI safety: this migration may run in environments where admin_users was never created.
    return unless table_exists?(:admin_users)

    add_column :admin_users, :two_factor_secret, :string unless column_exists?(:admin_users, :two_factor_secret)
    add_column :admin_users, :two_factor_recovery_codes, :text unless column_exists?(:admin_users, :two_factor_recovery_codes)
    add_column :admin_users, :two_factor_enabled, :boolean, default: false, null: false unless column_exists?(:admin_users, :two_factor_enabled)
  end
end
