module Sales
  class CustomFieldDefinition < ApplicationRecord
    self.table_name = 'sales_custom_field_definitions'
    belongs_to :company, optional: true
    has_many :values, class_name: 'Sales::CustomFieldValue', foreign_key: :definition_id, dependent: :destroy
    validates :entity_type, :key, :label, :field_type, presence: true
  end
end
