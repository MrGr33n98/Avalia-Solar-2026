class CreateCompanyWebhooks < ActiveRecord::Migration[7.0]
  def change
    create_table :company_webhooks, id: :uuid do |t|
      t.bigint :company_id, null: false, index: true
      t.string :url, null: false
      t.string :secret_key
      t.boolean :active, default: true
      t.jsonb :events, default: []
      t.timestamps
    end
    add_foreign_key :company_webhooks, :companies
    add_index :company_webhooks, [:company_id, :active]
  end
end
