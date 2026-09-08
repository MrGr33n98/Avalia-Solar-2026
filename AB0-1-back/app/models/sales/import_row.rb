# frozen_string_literal: true

module Sales
  class ImportRow < ApplicationRecord
    self.table_name = 'sales_import_rows'

    belongs_to :import, class_name: 'Sales::Import', foreign_key: :sales_import_id

    enum status: {
      pending: 'pending',
      valid: 'valid',
      invalid: 'invalid',
      duplicate: 'duplicate',
      skipped: 'skipped',
      processed: 'processed',
      failed: 'failed'
    }, _prefix: true

    validates :row_number, presence: true, numericality: { greater_than: 0 }
  end
end
