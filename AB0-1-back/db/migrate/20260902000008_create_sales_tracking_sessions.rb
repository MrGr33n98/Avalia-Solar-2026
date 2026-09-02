class CreateSalesTrackingSessions < ActiveRecord::Migration[7.0]
  def change
    create_table :sales_tracking_sessions do |t|
      t.references :account, foreign_key: { to_table: :sales_accounts }
      t.references :contact, foreign_key: { to_table: :sales_contacts }
      t.string :session_id, null: false
      t.string :anonymous_id
      t.string :utm_source
      t.string :utm_medium
      t.string :utm_campaign
      t.datetime :started_at, null: false
      t.datetime :ended_at
      t.timestamps
    end
    add_index :sales_tracking_sessions, :session_id, unique: true
  end
end
