class NormalizeUserRoles < ActiveRecord::Migration[7.0]
  def up
    change_column_default :users, :role, from: 'user', to: 'review'
    execute <<~SQL
      UPDATE users
      SET role = 'review'
      WHERE role IS NULL OR role IN ('user', 'admin')
    SQL
  end

  def down
    change_column_default :users, :role, from: 'review', to: 'user'
    execute <<~SQL
      UPDATE users
      SET role = 'user'
      WHERE role = 'review'
    SQL
  end
end
