class CreateCompanyDocuments < ActiveRecord::Migration[7.0]
  def change
    create_table :company_documents do |t|

      t.timestamps
    end
  end
end
