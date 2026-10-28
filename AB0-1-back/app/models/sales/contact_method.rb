# frozen_string_literal: true

module Sales
  class ContactMethod < ApplicationRecord
    self.table_name = 'sales_contact_methods'

    KINDS = %w[email phone whatsapp linkedin instagram website].freeze
    LABELS = %w[Trabalho Pessoal Comercial Outro].freeze
    SOURCES = %w[manual migration import integration].freeze

    belongs_to :contact, class_name: 'Sales::Contact', foreign_key: :sales_contact_id
    belongs_to :company, class_name: 'Company', optional: true
    belongs_to :created_by, class_name: 'User', optional: true
    belongs_to :updated_by, class_name: 'User', optional: true

    scope :active, -> { where(archived_at: nil) }
    scope :archived, -> { where.not(archived_at: nil) }
    scope :primary, -> { where(is_primary: true) }
    scope :by_kind, ->(kind) { where(kind: kind.to_s) }
    scope :ordered, -> { order(position: :asc, created_at: :asc) }

    validates :kind, presence: true, inclusion: { in: KINDS }
    validates :value, presence: true
    validates :normalized_value, presence: true
    validates :source, inclusion: { in: SOURCES }

    before_validation :normalize_and_compute_values
    before_validation :assign_company_from_contact, on: :create

    def active?
      archived_at.nil?
    end

    def archive!(actor = nil)
      update!(archived_at: Time.current, is_primary: false, updated_by: actor)
    end

    private

    def normalize_and_compute_values
      return if value.blank? || kind.blank?

      self.normalized_value = ::Sales::ContactMethods::Normalize.call(kind: kind, value: value)
    end

    def assign_company_from_contact
      return if company_id.present? || contact.nil?

      self.company_id = contact.account&.company_id
    end
  end
end
