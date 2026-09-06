# frozen_string_literal: true

module Sales
  class ContactImport < ApplicationRecord
    self.table_name = 'sales_contact_imports'

    belongs_to :company, class_name: '::Company'
    belongs_to :user, class_name: '::User'

    has_one_attached :file

    validates :filename, presence: true
    validates :status, presence: true, inclusion: { in: %w[uploaded validating ready importing completed failed cancelled] }

    scope :for_company, ->(company_id) { where(company_id: company_id) }
  end
end
