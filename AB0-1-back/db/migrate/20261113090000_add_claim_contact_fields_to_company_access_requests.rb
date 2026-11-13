class AddClaimContactFieldsToCompanyAccessRequests < ActiveRecord::Migration[7.0]
  def change
    add_column :company_access_requests, :contact_email, :string
    add_column :company_access_requests, :contact_phone, :string
  end
end
