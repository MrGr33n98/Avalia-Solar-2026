class CreateSalesEmailSuppressions < ActiveRecord::Migration[7.0]
  def change
    create_table :sales_email_suppressions do |t|
      t.references :company, null: false, foreign_key: true
      t.string :email, null: false
      t.string :reason, null: false
      t.datetime :suppressed_at, null: false, default: -> { 'CURRENT_TIMESTAMP' }
      t.timestamps
    end
    add_index :sales_email_suppressions, [:company_id, :email], unique: true
  end
end
