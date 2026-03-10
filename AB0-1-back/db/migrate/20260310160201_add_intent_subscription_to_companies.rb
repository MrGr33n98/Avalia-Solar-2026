class AddIntentSubscriptionToCompanies < ActiveRecord::Migration[7.0]
  def change
    add_column :companies, :intent_tier, :string, default: 'free', null: false
    add_column :companies, :intent_features, :jsonb, default: {}
    add_index :companies, :intent_tier
  end
end
