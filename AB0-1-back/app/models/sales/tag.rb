module Sales
  class Tag < ApplicationRecord
    self.table_name = 'sales_tags'
    ENTITY_TYPES = %w[Opportunity Account Contact].freeze
    belongs_to :company, optional: true
    belongs_to :created_by, class_name: 'User', optional: true
    has_many :taggings, class_name: 'Sales::Tagging', foreign_key: :sales_tag_id, dependent: :destroy
    before_validation :normalize_name
    validates :name, :normalized_name, :slug, presence: true
    validates :entity_type, inclusion: { in: ENTITY_TYPES }
    scope :active, -> { where(archived_at: nil) }
    private
    def normalize_name
      self.name = name.to_s.strip
      self.normalized_name = I18n.transliterate(name).downcase.gsub(/\s+/, ' ')
      self.slug = normalized_name.parameterize
    end
  end
end
