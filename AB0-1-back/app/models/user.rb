class User < ApplicationRecord
  devise :database_authenticatable, :registerable,
         :recoverable, :rememberable, :validatable, :confirmable,
         :omniauthable, omniauth_providers: [:google_oauth2]
  has_many :posts, dependent: :destroy
  has_many :comments, dependent: :destroy
  has_many :forum_answers, dependent: :destroy
  has_many :forum_questions, dependent: :destroy
  has_many :pending_changes, dependent: :destroy
  has_many :product_accesses, dependent: :destroy
  has_many :reviews, dependent: :destroy
  has_many :analytics_events, dependent: :destroy
  # By implementing this feature, users will be able to conveniently
  # associate and access all notifications directed towards them.
  has_many :notifications, as: :recipient, dependent: :destroy, class_name: 'Noticed::Notification'
  # Whenever you have noticed events that have the record pointing to the user,
  # such as when a new user joins a team or any similar occurrences,
  # It's important to ensure that notifications mentioning us are accessible.
  has_many :notification_mentions, as: :record, dependent: :destroy, class_name: 'Noticed::Event'
  has_one_attached :avatar

  belongs_to :company, optional: true
  has_many :company_members, dependent: :destroy
  has_many :member_companies, through: :company_members, source: :company

  # Role validation
  ROLES = %w[user admin company review].freeze
  enum status: { pending: 0, active: 1, rejected: 2, blocked: 3 }, _default: :pending

  validates :role, inclusion: { in: ROLES }, allow_nil: true
  validates :name, presence: true, length: { minimum: 3, maximum: 100 }
  validates :city, presence: true, if: -> { regular_user? }
  validates :state, length: { is: 2 }, allow_blank: true
  validate :password_complexity
  validate :adult_birthdate
  validates :terms_accepted, acceptance: { accept: true }
  validate :corporate_email_domain, if: -> { company_user? && company.present? && company.website.present? }

  def active_for_authentication?
    super && active?
  end

  def inactive_message
    active? ? super : (rejected? ? :rejected : :not_approved)
  end

  def approved_for_dashboard?
    approved_by_admin?
  end
  
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

  def review_user?
    role == 'review'
  end

  def reviewer?
    review_user?
  end
  
  def regular_user?
    role == 'user'
  end

  # Envia notificações do Devise de forma assíncrona (TASK-014)
  def send_devise_notification(notification, *args)
    devise_mailer.send(notification, self, *args).deliver_later
  end

  def self.ransackable_attributes(_auth_object = nil)
    %w[name email role status company_id] # Allow searching by name, email, role, status and company_id
  end

  def self.ransackable_associations(_auth_object = nil)
    %w[company]
  end

  def self.from_omniauth(auth)
    provider = auth.provider
    uid = auth.uid
    info = auth.info || {}
    email = (info.respond_to?(:email) ? info.email : info['email']).to_s.downcase
    name_value = info.respond_to?(:name) ? info.name : info['name']
    candidate_name = name_value.presence || email.split('@').first.to_s.tr('_', ' ').strip
    name = candidate_name.length >= 3 ? candidate_name : 'Usuario Google'

    user = find_or_initialize_by(provider: provider, uid: uid)
    user.email = email if user.email.blank?
    user.name = name if user.name.blank?

    if user.new_record?
      user.password = "Aa1#{SecureRandom.base64(18)}"
      user.terms_accepted = true
      user.terms_accepted_at ||= Time.current
      user.skip_confirmation! if user.respond_to?(:skip_confirmation!)
    end

    user.save
    user
  end
  
  private
  
  def set_default_role
    self.role ||= company_id.present? ? 'company' : 'user'
  end

  def corporate_email_domain
    return unless email.present?

    # Extract domain from website (e.g., "http://example.com" -> "example.com")
    website_url = company.website.match?(/\Ahttp/) ? company.website : "http://#{company.website}"
    website_domain = URI.parse(website_url).host&.sub(/^www\./, '')
    
    return unless website_domain

    email_domain = email.split('@').last
    
    unless email_domain.casecmp(website_domain).zero?
      errors.add(:email, "must be from company domain (#{website_domain})")
    end
  rescue URI::InvalidURIError
    # Ignore if website is invalid
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
