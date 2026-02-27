class AddCounterCaches < ActiveRecord::Migration[7.0]
  def change
    # Add cached counts to avoid N+1 queries
    add_column :companies, :reviews_count, :integer, default: 0
    add_column :companies, :financing_partners_count, :integer, default: 0
    add_column :companies, :company_members_count, :integer, default: 0
    add_column :companies, :leads_count, :integer, default: 0

    # Create indices on counters for sorting
    add_index :companies, :reviews_count
    add_index :companies, :financing_partners_count
    add_index :companies, :leads_count

    # Populate existing data
    execute "UPDATE companies SET reviews_count = (SELECT COUNT(*) FROM reviews WHERE reviews.company_id = companies.id)"
    execute "UPDATE companies SET leads_count = (SELECT COUNT(*) FROM leads WHERE leads.company_id = companies.id)"
  end

  def down
    remove_column :companies, :reviews_count
    remove_column :companies, :financing_partners_count
    remove_column :companies, :company_members_count
    remove_column :companies, :leads_count
  end
end
