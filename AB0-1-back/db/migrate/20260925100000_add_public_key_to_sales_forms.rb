# frozen_string_literal: true

class AddPublicKeyToSalesForms < ActiveRecord::Migration[7.0]
  def up
    add_column :sales_forms, :public_key, :string
    Sales::Form.reset_column_information
    Sales::Form.where(public_key: nil).find_each do |form|
      form.update_columns(public_key: SecureRandom.urlsafe_base64(32), updated_at: Time.current)
    end
    change_column_null :sales_forms, :public_key, false
    add_index :sales_forms, :public_key, unique: true
  end

  def down
    remove_index :sales_forms, :public_key
    remove_column :sales_forms, :public_key
  end
end
