class CreatePaymentWebhookEvents < ActiveRecord::Migration[7.0]
  def change
    create_table :payment_webhook_events do |t|
      t.string :provider, null: false
      t.string :provider_event_id, null: false
      t.string :event_type, null: false
      t.string :status, null: false, default: 'pending'
      t.jsonb :payload, null: false, default: {}
      t.text :error_message

      t.timestamps
    end

    add_index :payment_webhook_events, [:provider, :provider_event_id], unique: true
    add_index :payment_webhook_events, :status
  end
end
