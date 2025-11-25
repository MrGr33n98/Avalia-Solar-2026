class AddRole2ToUsers < ActiveRecord::Migration[7.0]
  def change
    unless column_exists?(:users, :role)
      add_column :users, :role, :string, default: 'user'
      add_index :users, :role
    end
  end
end
