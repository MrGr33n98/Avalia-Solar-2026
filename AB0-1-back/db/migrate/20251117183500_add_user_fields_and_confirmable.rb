class AddUserFieldsAndConfirmable < ActiveRecord::Migration[7.0]
  def change
    add_column :users, :date_of_birth, :date
    add_column :users, :terms_accepted, :boolean, default: false, null: false
    add_column :users, :terms_accepted_at, :datetime

    add_column :users, :provider, :string
    add_column :users, :uid, :string
    add_index :users, [:provider, :uid]

    add_column :users, :confirmation_token, :string
    add_column :users, :confirmed_at, :datetime
    add_column :users, :confirmation_sent_at, :datetime
    add_column :users, :unconfirmed_email, :string
    add_index :users, :confirmation_token, unique: true
  end
end
