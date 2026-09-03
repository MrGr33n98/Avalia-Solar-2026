class CreateSalesEmailLinks < ActiveRecord::Migration[7.0]
  def change
    create_table :sales_email_links do |t|
      t.references :email_message, null: false, foreign_key: { to_table: :sales_email_messages }
      t.string :token, null: false
      t.text :original_url, null: false
      t.integer :click_count, null: false, default: 0
      t.datetime :first_clicked_at
      t.datetime :last_clicked_at
      t.timestamps
    end
    add_index :sales_email_links, :token, unique: true
  end
end
