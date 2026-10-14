# frozen_string_literal: true

class CompanyInvitation < ApplicationRecord
  belongs_to :company
  belongs_to :invited_by, class_name: 'User'

  enum role: { owner: 0, manager: 1, editor: 2 }, _default: :editor
  enum status: { pending: 'pending', accepted: 'accepted', expired: 'expired', revoked: 'revoked' }, _default: :pending

  validates :email, presence: true, format: { with: URI::MailTo::EMAIL_REGEXP }
  validates :token_digest, :expires_at, presence: true

  scope :pending, -> { where(status: 'pending').where('expires_at > ?', Time.current) }

  def self.digest(token)
    Digest::SHA256.hexdigest(token.to_s)
  end

  def self.find_by_token(raw_token)
    return nil if raw_token.blank?

    pending.find_by(token_digest: digest(raw_token))
  end

  def generate_token!
    raw_token = SecureRandom.urlsafe_base64(32)
    self.token_digest = self.class.digest(raw_token)
    self.expires_at = 7.days.from_now
    self.status = 'pending'
    raw_token
  end

  def expired?
    status == 'expired' || expires_at <= Time.current
  end

  def accept!(user)
    return false if expired? || status != 'pending'
    return false if user.blank?

    ActiveRecord::Base.transaction do
      member = company.company_members.find_or_initialize_by(user_id: user.id)
      member.role = role
      member.status = 'active'
      member.save!

      update!(status: 'accepted', accepted_at: Time.current)
    end
    true
  end
end
