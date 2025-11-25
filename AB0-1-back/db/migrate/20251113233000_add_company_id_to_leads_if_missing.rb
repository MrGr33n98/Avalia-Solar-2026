class AddCompanyIdToLeadsIfMissing < ActiveRecord::Migration[7.0]
  def up
    unless column_exists?(:leads, :company_id)
      add_reference :leads, :company, foreign_key: true
    end
  end

  def down
    if column_exists?(:leads, :company_id)
      remove_reference :leads, :company, foreign_key: true
    end
  end
end

