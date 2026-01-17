class AddFieldsToUsersAndReviews < ActiveRecord::Migration[7.0]
  def change
    add_column :users, :city, :string
    add_column :users, :state, :string
    add_column :users, :phone, :string

    add_column :reviews, :status, :integer, default: 0
    add_column :reviews, :reply, :text
    add_column :reviews, :replied_at, :datetime
  end
end
