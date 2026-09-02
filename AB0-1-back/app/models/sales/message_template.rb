module Sales
  class MessageTemplate < ApplicationRecord
    self.table_name = 'sales_message_templates'

    CATEGORIES = %w[first_contact follow_up proposal reactivation claim_profile profile_optimization].freeze

    validates :name, presence: true
    validates :body, presence: true
    validates :category, inclusion: { in: CATEGORIES }

    scope :active, -> { where(active: true) }

    def render_body(context = {})
      rendered = body.dup
      context.each do |key, val|
        rendered.gsub!("{{#{key}}}", val.to_s)
      end
      rendered
    end
  end
end
