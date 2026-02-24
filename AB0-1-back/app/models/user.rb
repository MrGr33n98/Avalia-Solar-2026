class User < ApplicationRecord
  ALLOWED_AVATAR_CONTENT_TYPES = %w[image/png image/jpeg image/jpg].freeze
  MAX_AVATAR_SIZE_BYTES = 5.megabytes

  devise :database_authenticatable, :registerable,
         :recoverable, :rememberable, :validatable, :confirmable,
         :omniauthable, omniauth_providers: [:google_oauth2, :linkedin]
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
  has_many :company_access_requests, dependent: :destroy
  has_many :active_company_members, -> { where(status: 'active') }, class_name: 'CompanyMember'
  has_many :member_companies, through: :company_members, source: :company
  has_many :active_member_companies, through: :active_company_members, source: :company
  accepts_nested_attributes_for :company_members, allow_destroy: true

  # Role validation
  ROLES = %w[admin company review].freeze
  enum status: { pending: 0, active: 1, rejected: 2, blocked: 3 }, _default: :pending

  validates :role, inclusion: { in: ROLES }, allow_nil: true
  validates :name, presence: true, length: { minimum: 3, maximum: 100 }
  validates :city, presence: true, if: -> { regular_user? }
  validates :state, length: { is: 2 }, allow_blank: true
  validate :password_complexity
  validate :adult_birthdate
  validate :validate_attachments
  validates :terms_accepted, acceptance: { accept: true }
  validate :corporate_email_domain, if: -> { company_user? && active_member_companies.any? }

  def approved_for_dashboard?
    return true if review_user?
    approved_by_admin?
  end

  def company
    selected = super
    return selected if selected && active_membership_for?(selected.id)
    active_member_companies.first
  end

  def current_company
    company
  end

  def active?
    return false unless active_status?
    return true if review_user?
    company_user? && active_company_members.exists?
  end

  def active_status?
    status == 'active'
  end
  
  # Set default role
  after_initialize :set_default_role, if: :new_record?
  before_validation :normalize_role
  before_validation :mark_terms_accepted_at
  
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
    review_user?
  end

  def active_membership_for?(company_id)
    return false if company_id.blank?
    active_company_members.exists?(company_id: company_id)
  end

  # Envia notificações do Devise de forma assíncrona (TASK-014)
  def send_devise_notification(notification, *args)
    devise_mailer.send(notification, self, *args).deliver_later
  end

  # Override: Prevent confirmation email before admin approval for company users
  def send_confirmation_instructions
    return false if company_user? && !approved_by_admin?
    super
  end

  # Override: Skip confirmation notification for OAuth users
  def send_on_create_confirmation_instructions
    return if provider.present? # Skip for OAuth users
    return false if company_user? && !approved_by_admin?
    super
  end

  def active_for_authentication?
    super && active?
  end

  def inactive_message
    active? ? super : status.to_sym
  end

  def self.ransackable_attributes(_auth_object = nil)
    %w[name email role status company_id approved_by_admin] # Allow searching by name, email, role, status, company_id and approved_by_admin
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
    
    # Fallback name based on provider
    default_name = case provider
                   when 'google_oauth2'
                     'Usuario Google'
                   when 'linkedin'
                     'Usuario LinkedIn'
                   else
                     'Usuario Social'
                   end
    name = candidate_name.length >= 3 ? candidate_name : default_name

    user = find_or_initialize_by(provider: provider, uid: uid)
    user.email = email if user.email.blank?
    user.name = name if user.name.blank?

    if user.new_record?
      user.password = "Aa1#{SecureRandom.base64(18)}"
      user.terms_accepted = true
      user.terms_accepted_at ||= Time.current
      
      # OAuth users with verified email from provider can skip email confirmation
      # But company users still need admin approval before accessing dashboard
      user.skip_confirmation! if user.respond_to?(:skip_confirmation!)
      
      # Set status to pending if user is company role
      user.status = user.company_user? ? :pending : :active
    end

    user.save
    user
  end

  protected

  def after_confirmation
    super
    Analytics::TrackEventService.call(
      event_type: 'email_confirmed',
      user: self,
      company_id: company_id,
      metadata: {
        method: provider.present? ? provider : 'email',
        confirmed_at: confirmed_at
      }
    )
  rescue => e
    Rails.logger.error("[Analytics] Failed to track email confirmation: #{e.message}")
  end

  private
  
  def set_default_role
    self.role ||= company_id.present? ? 'company' : 'review'
  end

  def normalize_role
    return if role.blank?
    return if ROLES.include?(role)
    self.role = 'review'
  end

  def corporate_email_domain
    return if email.blank?
    
    # Se o usuário está vinculado a empresas, validamos contra os domínios delas
    # No novo fluxo, o usuário pode não ter empresa no cadastro inicial
    companies_with_website = active_member_companies.where.not(website: [nil, ''])
    return if companies_with_website.empty?

    valid_domains = companies_with_website.map do |c|
      website_url = c.website.match?(/\Ahttp/) ? c.website : "http://#{c.website}"
      URI.parse(website_url).host&.sub(/\Awww\./, '') rescue nil
    end.compact

    return if valid_domains.empty?

    unless valid_domains.any? { |domain| email.downcase.include?(domain.downcase) }
      errors.add(:email, "must be from one of your companies domains (#{valid_domains.join(', ')})")
    end
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

  def validate_attachments
    return unless avatar.attached?

    unless avatar.blob.content_type.in?(ALLOWED_AVATAR_CONTENT_TYPES)
      errors.add(:avatar, 'deve ser JPG ou PNG')
    end

    if avatar.blob.byte_size > MAX_AVATAR_SIZE_BYTES
      errors.add(:avatar, 'tamanho máximo é 5MB')
    end
  end
end
