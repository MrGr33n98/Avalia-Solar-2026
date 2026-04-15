# frozen_string_literal: true

class LeadWizardVersion < ApplicationRecord
  enum status: {
    draft: 'draft',
    published: 'published',
    archived: 'archived'
  }

  belongs_to :company, optional: true, inverse_of: :lead_wizard_versions, touch: true
  belongs_to :category, optional: true, inverse_of: :lead_wizard_versions, touch: true
  has_many :lead_wizard_sections, dependent: :destroy, inverse_of: :lead_wizard_version
  has_many :lead_wizard_fields, through: :lead_wizard_sections
  has_many :lead_wizard_field_options, through: :lead_wizard_fields

  validates :template_key, presence: true
  validates :template_version, presence: true, numericality: { greater_than: 0 }
  validates :version_number, presence: true, numericality: { greater_than: 0 }
  validates :status, inclusion: { in: statuses.keys }
  validate :validate_scope_exclusivity
  validate :validate_version_uniqueness
  validate :validate_published_structure, if: :published?
  validate :validate_published_choice_fields, if: :published?

  before_validation :normalize_fields
  before_validation :assign_version_number, on: :create
  before_validation :downcase_status

  scope :published, -> { where(status: statuses[:published]) }
  scope :draft, -> { where(status: statuses[:draft]) }
  scope :archived, -> { where(status: statuses[:archived]) }
  scope :for_company, ->(company_id) { where(company_id: company_id) }
  scope :for_category, ->(category_id) { where(category_id: category_id) }
  scope :global_scope, -> { where(company_id: nil, category_id: nil) }
  scope :latest_first, -> { order(version_number: :desc, updated_at: :desc) }

  def self.ransackable_attributes(_auth_object = nil)
    %w[
      id company_id category_id template_key template_version version_number status
      ui_theme ui_primary_color ui_logo_url show_progress_bar thank_you_title
      thank_you_message thank_you_redirect_url published_at archived_at
      created_at updated_at
    ]
  end

  def self.ransackable_associations(_auth_object = nil)
    %w[company category lead_wizard_sections lead_wizard_fields lead_wizard_field_options]
  end

  def self.next_version_number_for(company_id:, category_id:)
    relation = where(company_id: company_id, category_id: category_id)
    relation.maximum(:version_number).to_i + 1
  end

  def scope_kind
    return 'company' if company_id.present?
    return 'category' if category_id.present?

    'global'
  end

  def scope_label
    return "Empresa: #{company.name}" if company.present?
    return "Categoria: #{category.name}" if category.present?

    'Global'
  end

  def compiled_schema
    LeadWizard::VersionCompiler.call(self)
  end

  def compiled_thank_you_config
    LeadWizard::VersionCompiler.new(self).thank_you_config
  end

  private

  def normalize_fields
    self.template_key = template_key.to_s.strip if template_key.present?
    self.ui_theme = ui_theme.to_s.strip.presence || 'auto'
    self.show_progress_bar = true if show_progress_bar.nil?
    self.status = status.to_s.strip.presence || 'draft'
  end

  def assign_version_number
    self.version_number ||= self.class.next_version_number_for(
      company_id: company_id,
      category_id: category_id
    )
  end

  def downcase_status
    self.status = status.to_s.downcase
  end

  def validate_scope_exclusivity
    if company_id.present? && category_id.present?
      errors.add(:base, 'Use apenas um escopo por versão: empresa, categoria ou global')
    end
  end

  def validate_version_uniqueness
    scope = self.class.where(
      company_id: company_id,
      category_id: category_id,
      version_number: version_number
    )
    scope = scope.where.not(id: id) if persisted?

    errors.add(:version_number, 'já existe para este escopo') if scope.exists?
  end

  def validate_published_structure
    if lead_wizard_sections.empty?
      errors.add(:base, 'uma versão publicada precisa ter ao menos uma seção')
    end

    if lead_wizard_fields.empty?
      errors.add(:base, 'uma versão publicada precisa ter ao menos um campo')
    end
  end

  def validate_published_choice_fields
    lead_wizard_fields.select { |field| field.field_type.in?(%w[select radio]) }.each do |field|
      next if field.lead_wizard_field_options.any?

      errors.add(:base, "o campo #{field.key} precisa ter ao menos uma opção para publicação")
    end
  end
end
