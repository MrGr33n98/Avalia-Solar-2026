# frozen_string_literal: true

# Migration: Adiciona billing_role ao AdminUser
# para controle granular de permissões de billing
#
# Roles: nil = leitura apenas, 'support', 'finance', 'super_admin'
# Rollback: rails db:rollback STEP=1 — seguro
class AddBillingRoleToAdminUsers < ActiveRecord::Migration[7.0]
  def change
    add_column :admin_users, :billing_role, :string,
               comment: 'Papel de billing: nil=leitura, support, finance, super_admin'

    add_index :admin_users, :billing_role, where: 'billing_role IS NOT NULL'
  end
end
