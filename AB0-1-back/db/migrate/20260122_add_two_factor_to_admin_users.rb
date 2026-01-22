# frozen_string_literal: true

class AddTwoFactorToAdminUsers < ActiveRecord::Migration[7.0]
  def change
    # Campos para autenticação de dois fatores
    add_column :admin_users, :two_factor_secret, :string
    add_column :admin_users, :two_factor_recovery_codes, :text
    add_column :admin_users, :two_factor_enabled, :boolean, default: false
  end
end