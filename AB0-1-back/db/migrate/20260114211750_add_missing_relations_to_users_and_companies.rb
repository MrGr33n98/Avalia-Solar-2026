class AddMissingRelationsToUsersAndCompanies < ActiveRecord::Migration[7.0]
  def change
    add_reference :users, :company, foreign_key: true unless column_exists?(:users, :company_id)
    add_reference :companies, :plan, foreign_key: true unless column_exists?(:companies, :plan_id)
  end
end
