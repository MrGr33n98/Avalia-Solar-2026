class User < ApplicationRecord
  devise :database_authenticatable, :registerable,
         :recoverable, :rememberable, :validatable, :confirmable
  has_many :posts, dependent: :destroy
  has_many :comments, dependent: :destroy
  # By implementing this feature, users will be able to conveniently
  # associate and access all notifications directed towards them.
  has_many :notifications, as: :recipient, dependent: :destroy, class_name: 'Noticed::Notification'
  # Whenever you have noticed events that have the record pointing to the user,
  # such as when a new user joins a team or any similar occurrences,
  # It's important to ensure that notifications mentioning us are accessible.
  has_many :notification_mentions, as: :record, dependent: :destroy, class_name: 'Noticed::Event'

  belongs_to :company, optional: true

  # Role validation
  ROLES = %w[user admin company].freeze
  validates :role, inclusion: { in: ROLES }, allow_nil: true
  validates :name, presence: true, length: { minimum: 3, maximum: 100 }
  validate :password_complexity
  validate :adult_birthdate
  validates :terms_accepted, acceptance: { accept: true }
  
  # Set default role
  after_initialize :set_default_role, if: :new_record?
  before_validation :mark_terms_accepted_at
  
  # Role helper methods
  def admin?
    role == 'admin'
  end
  
  def company_user?
    role == 'company'
  end
  
  def regular_user?
    role == 'user'
  end

  def self.ransackable_attributes(_auth_object = nil)
    %w[name email role] # Allow searching by name, email, and role
  end

  def self.ransackable_associations(_auth_object = nil)
    [] # We don't have any searchable associations in this case
  end
  
  private
  
  def set_default_role
    self.role ||= company_id.present? ? 'company' : 'user'
  end

  def password_complexity
    return if password.blank?
    rules = [
      /[A-Z]/.match?(password),
      /[a-z]/.match?(password),
      /\d/.match?(password),
      password.length >= 8
    ]
    errors.add(:password, 'deve ter ao menos 1 maiúscula, 1 minúscula, 1 número e 8+ caracteres') unless rules.all?
  end

  def adult_birthdate
    return if date_of_birth.blank?
    errors.add(:date_of_birth, 'deve indicar 18+ anos') unless date_of_birth <= 18.years.ago.to_date
  end

  def mark_terms_accepted_at
    if terms_accepted_changed? && terms_accepted
      self.terms_accepted_at ||= Time.current
    end
  end
end
