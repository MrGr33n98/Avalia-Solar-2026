class AddReviewConsentFieldsToUsers < ActiveRecord::Migration[7.0]
  def change
    add_column :users, :public_name_consent, :boolean, default: false, null: false
    add_column :users, :display_full_name_consent, :boolean, default: false, null: false
    add_column :users, :review_name_consent, :boolean, default: false, null: false
    add_column :users, :lgpd_name_consent, :boolean, default: false, null: false
    add_column :users, :show_full_name, :boolean, default: false, null: false
  end
end
