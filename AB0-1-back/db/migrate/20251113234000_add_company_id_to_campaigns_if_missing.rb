class AddCompanyIdToCampaignsIfMissing < ActiveRecord::Migration[7.0]
  def up
    unless column_exists?(:campaigns, :company_id)
      add_reference :campaigns, :company, foreign_key: true
    end
  end

  def down
    if column_exists?(:campaigns, :company_id)
      remove_reference :campaigns, :company, foreign_key: true
    end
  end
end