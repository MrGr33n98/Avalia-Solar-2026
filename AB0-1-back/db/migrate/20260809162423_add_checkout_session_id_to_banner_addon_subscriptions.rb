class AddCheckoutSessionIdToBannerAddonSubscriptions < ActiveRecord::Migration[7.0]
  def change
    add_column :banner_addon_subscriptions, :checkout_session_id, :string
    add_index :banner_addon_subscriptions, :checkout_session_id
  end
end
