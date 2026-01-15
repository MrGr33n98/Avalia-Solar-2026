class AddMissingRelationsToUsersAndCompanies < ActiveRecord::Migration[7.0]
  def change
    add_reference :users, :company, foreign_key: true
    add_reference :companies, :plan, foreign_key: true
  end
end
