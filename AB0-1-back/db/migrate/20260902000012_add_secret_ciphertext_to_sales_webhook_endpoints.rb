class AddSecretCiphertextToSalesWebhookEndpoints < ActiveRecord::Migration[7.0]
  def change
    add_column :sales_webhook_endpoints, :secret_ciphertext, :text
  end
end
