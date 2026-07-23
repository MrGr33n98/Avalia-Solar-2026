# frozen_string_literal: true

class MaterialDownload < ApplicationRecord
  DELIVERY_STATUSES = %w[authorized delivered failed expired revoked].freeze

  belongs_to :company
  belongs_to :company_material
  belongs_to :content_lead, optional: true
  belongs_to :content_lead_form, optional: true

  validates :authorization_token_digest, :authorized_at, :expires_at, presence: true
  validates :delivery_status, inclusion: { in: DELIVERY_STATUSES }
  validate :company_matches_material

  scope :delivered, -> { where(delivery_status: 'delivered') }

  def self.ransackable_attributes(_auth_object = nil)
    %w[id company_id company_material_id content_lead_id content_lead_form_id anonymous_id delivery_status authorized_at expires_at delivered_at created_at updated_at]
  end

  def self.ransackable_associations(_auth_object = nil)
    %w[company company_material content_lead content_lead_form]
  end

  private

  def company_matches_material
    return if company_material.blank? || company_id == company_material.company_id

    errors.add(:company, 'deve ser a empresa do material')
  end
end
