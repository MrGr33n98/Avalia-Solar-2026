class CreateBannerAuditLogs < ActiveRecord::Migration[7.0]
  def change
    create_table :banner_audit_logs do |t|
      t.references :auditable, polymorphic: true, null: false
      t.references :actor, polymorphic: true
      t.string :source
      t.string :action, null: false
      t.jsonb :changes_json, default: {}, null: false
      t.jsonb :metadata_json, default: {}, null: false
      t.string :reason
      t.string :ip_address

      t.timestamps
    end
    
    add_index :banner_audit_logs, :action
    add_index :banner_audit_logs, :source
  end
end
