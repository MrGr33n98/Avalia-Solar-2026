class AddStatusToCompanyMembers < ActiveRecord::Migration[7.0]
  def change
    add_column :company_members, :status, :string, null: false, default: 'active'
    add_index :company_members, :status

    reversible do |dir|
      dir.up do
        execute "UPDATE company_members SET status = 'active' WHERE status IS NULL"
      end
    end
  end
end
