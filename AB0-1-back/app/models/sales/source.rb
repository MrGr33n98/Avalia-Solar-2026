# frozen_string_literal: true

module Sales
  class Source < ApplicationRecord
    self.table_name = 'sales_sources'

    has_many :opportunities, class_name: 'Sales::Opportunity', foreign_key: :source_id, dependent: :nullify

    validates :name, presence: true
    validates :slug, presence: true, uniqueness: true

    before_validation :generate_slug

    scope :active, -> { where(active: true) }

    private

    def generate_slug
      self.slug = name.parameterize if name.present? && slug.blank?
    end
  end
end
