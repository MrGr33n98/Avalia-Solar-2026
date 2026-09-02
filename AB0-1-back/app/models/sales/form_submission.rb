module Sales
  class FormSubmission < ApplicationRecord
    self.table_name = 'sales_form_submissions'
    belongs_to :form, class_name: 'Sales::Form'
    belongs_to :account, class_name: 'Sales::Account', optional: true
    belongs_to :contact, class_name: 'Sales::Contact', optional: true
    belongs_to :campaign, class_name: 'Sales::Campaign', optional: true
    validates :idempotency_key, presence: true, uniqueness: true
  end
end
