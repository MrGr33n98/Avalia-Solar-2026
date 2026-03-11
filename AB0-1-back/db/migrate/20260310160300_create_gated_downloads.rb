class CreateGatedDownloads < ActiveRecord::Migration[7.0]
  def change
    create_table :gated_downloads, id: :uuid do |t|
      t.bigint :company_id, null: false, index: true
      t.bigint :user_id, index: true
      t.string :anonymous_id, index: true
      t.string :document_type, null: false
      t.string :document_title
      t.string :document_url
      t.string :contact_name
      t.string :contact_email
      t.string :contact_phone
      t.jsonb :metadata, default: {}
      t.timestamps
    end

    add_foreign_key :gated_downloads, :companies
    add_foreign_key :gated_downloads, :users, column: :user_id
    add_index :gated_downloads, [:company_id, :document_type]
    add_index :gated_downloads, :created_at
  end
end
