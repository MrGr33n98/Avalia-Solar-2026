# frozen_string_literal: true

module Sales
  class Import < ApplicationRecord
    self.table_name = 'sales_imports'

    belongs_to :company
    belongs_to :user
    has_many :rows, class_name: 'Sales::ImportRow', foreign_key: :sales_import_id, dependent: :destroy

    has_one_attached :file

    enum status: {
      uploaded: 'uploaded',
      mapping: 'mapping',
      validating: 'validating',
      ready: 'ready',
      queued: 'queued',
      processing: 'processing',
      completed: 'completed',
      completed_with_errors: 'completed_with_errors',
      failed: 'failed',
      cancelled: 'cancelled'
    }, _prefix: true

    validates :entity_type, presence: true
    validates :filename, presence: true

    # csv_headers guarda as colunas originais do CSV (ex: ["empresa", "nome", "email"])
    # para que o wizard sempre mostre as colunas reais, não os campos CRM internos.
    attribute :csv_headers, :jsonb, default: []

    scope :for_company, ->(company_id) { where(company_id: company_id) }
  end
end
