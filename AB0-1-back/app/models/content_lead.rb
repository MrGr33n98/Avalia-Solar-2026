# frozen_string_literal: true

require 'digest'

class ContentLead < ApplicationRecord
  belongs_to :company
  has_many :material_downloads, dependent: :restrict_with_error

  validates :email, presence: true, format: { with: URI::MailTo::EMAIL_REGEXP }
  validates :email_digest, presence: true, uniqueness: { scope: :company_id }

  before_validation :normalize_email

  def self.digest_for(email)
    Digest::SHA256.hexdigest(email.to_s.strip.downcase)
  end

  def self.ransackable_attributes(_auth_object = nil)
    %w[id company_id email name phone company_name last_seen_at created_at updated_at]
  end

  def self.ransackable_associations(_auth_object = nil)
    %w[company material_downloads]
  end

  private

  def normalize_email
    self.email = email.to_s.strip.downcase
    self.email_digest = self.class.digest_for(email) if email.present?
  end
end
