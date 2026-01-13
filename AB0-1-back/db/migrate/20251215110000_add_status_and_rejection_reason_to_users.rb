class AddStatusAndRejectionReasonToUsers < ActiveRecord::Migration[7.0]
  def change
    add_column :users, :status, :integer, default: 0 unless column_exists?(:users, :status)
    add_column :users, :rejection_reason, :text unless column_exists?(:users, :rejection_reason)
    add_index :users, :status unless index_exists?(:users, :status)

    reversible do |dir|
      dir.up do
        # Atualiza status baseado em approved_by_admin apenas se a coluna existir
        if column_exists?(:users, :approved_by_admin)
          execute <<~SQL
            UPDATE users SET status = 1 WHERE approved_by_admin = 1;
          SQL
        end
      end
    end
  end
end
