class CreateBillingAuditLogs < ActiveRecord::Migration[7.0]
  def change
    create_table :billing_audit_logs do |t|
      t.references :user, null: false, foreign_key: true
      t.references :company, null: false, foreign_key: true
      t.integer :action
      t.integer :plan_id
      t.jsonb :metadata

      t.timestamps
    end
  end
end
