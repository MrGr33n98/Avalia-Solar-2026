module Sales
  class Consent < ApplicationRecord
    self.table_name = 'sales_consents'
    belongs_to :contact, class_name: 'Sales::Contact'
    validates :purpose, :lawful_basis, presence: true
  end
end
