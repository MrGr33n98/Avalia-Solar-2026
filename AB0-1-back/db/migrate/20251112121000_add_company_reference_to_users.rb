class AddCompanyReferenceToUsers < ActiveRecord::Migration[7.0]
  def change
    unless column_exists?(:users, :company_id)
      add_reference :users, :company, foreign_key: true, index: true
    end
  end
end