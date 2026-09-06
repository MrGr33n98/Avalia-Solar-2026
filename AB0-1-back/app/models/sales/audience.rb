module Sales
  class Audience < ApplicationRecord
    self.table_name = 'sales_audiences'

    belongs_to :company
    belongs_to :created_by, class_name: 'User'
    has_many :campaigns, class_name: 'Sales::Campaign', foreign_key: :audience_id, inverse_of: :audience
    validates :name, presence: true, length: { maximum: 200 }
    validates :kind, inclusion: { in: %w[dynamic] }
    validate :valid_filter_definition

    private

    def valid_filter_definition
      unless filter_definition.is_a?(Hash) && (filter_definition.keys - %w[state city segment search tag_ids]).empty?
        errors.add(:filter_definition, 'contém filtros não suportados')
      end
    end
  end
end
