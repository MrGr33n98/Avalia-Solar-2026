module Sales
  class CustomFieldValue < ApplicationRecord
    self.table_name = 'sales_custom_field_values'
    belongs_to :definition, class_name: 'Sales::CustomFieldDefinition'
    validates :entity_type, :entity_id, presence: true
  end
end
