require 'securerandom'

class EnforceSkuNotNullOnProducts < ActiveRecord::Migration[7.0]
  disable_ddl_transaction!

  class MigrationProduct < ApplicationRecord
    self.table_name = 'products'
  end

  def up
    return unless table_exists?(:products) && column_exists?(:products, :sku)

    backfill_missing_skus

    adapter = ActiveRecord::Base.connection.adapter_name.downcase
    change_column_null :products, :sku, false if adapter.include?('sqlite') || adapter.include?('postgres')
  end

  def down
    change_column_null :products, :sku, true if table_exists?(:products) && column_exists?(:products, :sku)
  end

  private

  def backfill_missing_skus
    MigrationProduct.where(sku: [nil, '']).find_in_batches(batch_size: 100) do |batch|
      batch.each do |product|
        product.update_columns(sku: generated_sku_for(product))
      end
    end
  end

  def generated_sku_for(product)
    base = "SKU-#{product.id || SecureRandom.hex(4)}"
    suffix = 0

    loop do
      candidate = suffix.zero? ? base : "#{base}-#{suffix}"
      exists = MigrationProduct.where.not(id: product.id).where(sku: candidate).exists?
      return candidate unless exists
      suffix += 1
    end
  end
end
