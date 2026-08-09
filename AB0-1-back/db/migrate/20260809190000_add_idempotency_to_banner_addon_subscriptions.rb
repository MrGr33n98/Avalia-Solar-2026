class AddIdempotencyToBannerAddonSubscriptions < ActiveRecord::Migration[7.0]
  def change
    add_column :banner_addon_subscriptions, :idempotency_key, :string
    add_column :banner_addon_subscriptions, :checkout_url, :text

    add_index :banner_addon_subscriptions,
              %i[company_id idempotency_key],
              unique: true,
              where: 'idempotency_key IS NOT NULL',
              name: 'idx_banner_addon_subscriptions_idempotency'
  end
end
