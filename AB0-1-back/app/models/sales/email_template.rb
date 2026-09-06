# frozen_string_literal: true

module Sales
  class EmailTemplate < ApplicationRecord
    self.table_name = 'sales_email_templates'

    STATUSES = %w[draft active archived].freeze

    belongs_to :company
    belongs_to :user, optional: true

    validates :name, :subject_template, presence: true
    validates :status, inclusion: { in: STATUSES }

    scope :active, -> { where(status: 'active') }
    scope :draft, -> { where(status: 'draft') }
    scope :archived, -> { where(status: 'archived') }
    scope :shared, -> { where(user_id: nil) }
    scope :by_category, ->(cat) { where(category: cat) if cat.present? }
    scope :by_status, ->(st) { where(status: st) if st.present? }
    scope :by_scope, ->(sc, user_id) {
      case sc.to_s
      when 'shared' then shared
      when 'mine' then where(user_id: user_id)
      else all
      end
    }
    scope :search_by_q, ->(q) {
      if q.present?
        term = "%#{q.strip}%"
        where('name ILIKE ? OR subject_template ILIKE ? OR preheader ILIKE ?', term, term, term)
      end
    }

    def duplicate!
      new_template = dup
      new_template.name = "#{name} (cópia)"
      new_template.status = 'draft'
      new_template.created_at = nil
      new_template.updated_at = nil
      new_template.save!
      new_template
    end

    def archive!
      update!(status: 'archived')
    end
  end
end
