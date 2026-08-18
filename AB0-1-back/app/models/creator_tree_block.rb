# frozen_string_literal: true

class CreatorTreeBlock < ApplicationRecord
  require 'uri'
  TYPES = %w[external_link whatsapp social company publication].freeze
  MAX_ACTIVE_BLOCKS = 8

  belongs_to :reviewer, class_name: 'ReviewerProfile'
  belongs_to :company, optional: true
  belongs_to :publication, class_name: 'ReviewerPublication', optional: true

  validates :block_type, inclusion: { in: TYPES }
  validates :title, presence: true, length: { maximum: 120 }
  validates :subtitle, length: { maximum: 240 }, allow_blank: true
  validates :position, numericality: { only_integer: true, greater_than_or_equal_to: 0 }
  validates :url, length: { maximum: 1000 }, allow_blank: true
  validate :safe_url
  validate :active_limit
  validate :company_for_type
  validate :publication_for_type
  validate :references_belong_to_reviewer

  scope :active_ordered, -> { where(active: true).order(position: :asc, id: :asc) }

  before_validation :normalize_whatsapp

  private

  def safe_url
    return if url.blank?

    uri = URI.parse(url)
    return if uri.is_a?(URI::HTTP) && uri.host.present?

    errors.add(:url, 'deve usar URL http ou https válida')
  rescue URI::InvalidURIError
    errors.add(:url, 'deve usar URL http ou https válida')
  end

  def active_limit
    return unless active? && reviewer
    return if reviewer.creator_tree_blocks.where(active: true).where.not(id: id).count < MAX_ACTIVE_BLOCKS

    errors.add(:active, 'creator pode ter no máximo 8 blocos ativos')
  end

  def company_for_type
    return unless block_type == 'company' && company.blank?

    errors.add(:company, 'é obrigatório para bloco de empresa')
  end

  def publication_for_type
    return if block_type != 'publication' || publication.present?

    errors.add(:publication, 'é obrigatório para bloco de publicação')
  end

  def references_belong_to_reviewer
    if company.present? && reviewer.user.active_member_companies.where(id: company.id).none?
      errors.add(:company, 'não pertence ao creator')
    end

    if publication.present? && publication.user_id != reviewer.user_id
      errors.add(:publication, 'não pertence ao creator')
    end
  end

  def normalize_whatsapp
    return unless block_type == 'whatsapp' && url.present?

    digits = url.to_s.gsub(/\D/, '')
    self.url = digits.present? ? "https://wa.me/#{digits}" : url
  end
end