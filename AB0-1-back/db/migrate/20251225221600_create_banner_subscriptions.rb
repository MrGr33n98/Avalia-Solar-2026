class CreateBannerSubscriptions < ActiveRecord::Migration[7.0]
  def change
    create_table :banner_subscriptions do |t|
      t.references :company, null: false, foreign_key: true
      t.references :banner_offer, null: false, foreign_key: true

      t.string :status, null: false, default: 'pending_payment'
      t.datetime :starts_at
      t.datetime :ends_at

      t.string :provider
      t.string :checkout_session_id
      t.string :payment_reference

      t.datetime :activated_at
      t.datetime :canceled_at
      t.string :failure_reason

      t.json :metadata_json, null: false, default: {}

      t.timestamps
    end

    add_index :banner_subscriptions, :status
    add_index :banner_subscriptions, :checkout_session_id
    add_index :banner_subscriptions, :payment_reference
  end
end
