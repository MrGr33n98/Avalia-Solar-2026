class User < ApplicationRecord
  ALLOWED_AVATAR_CONTENT_TYPES = %w[image/png image/jpeg image/jpg].freeze
  MAX_AVATAR_SIZE_BYTES = 5.megabytes
  PUBLIC_EMAIL_DOMAINS = %w[
    gmail.com outlook.com hotmail.com yahoo.com icloud.com uol.com.br
    terra.com.br bol.com.br ig.com.br globomail.com
  ].freeze

  devise :database_authenticatable, :registerable,
         :recoverable, :rememberable, :validatable, :confirmable,
         :omniauthable, omniauth_providers: %i[google_oauth2 linkedin facebook]
  has_many :social_follows, foreign_key: :follower_id, inverse_of: :follower, dependent: :destroy
  has_many :posts, dependent: :destroy
  has_many :comments, dependent: :destroy
  has_many :conversations, dependent: :destroy
  has_many :forum_answers, dependent: :destroy
  has_many :forum_questions, dependent: :destroy
  has_many :pending_changes, dependent: :destroy
  has_many :product_accesses, dependent: :destroy
  has_many :subscription_plans, foreign_key: :member_id, inverse_of: :member, dependent: :nullify
  has_many :sponsored_plans, foreign_key: :member_id, inverse_of: :member, dependent: :nullify
  has_many :reviews, dependent: :destroy
  has_many :favorites, dependent: :destroy
  has_many :review_upload_sessions, dependent: :destroy
  has_many :review_media, class_name: 'ReviewMedia', dependent: :destroy
  has_many :reviewer_solutions, dependent: :destroy
  has_many :reviewer_publications, dependent: :destroy
  has_many :group_memberships, dependent: :destroy
  has_many :group_posts, dependent: :restrict_with_error
  has_many :owned_groups, class_name: 'Group', foreign_key: :owner_id, dependent: :restrict_with_error
  has_one :reviewer_profile, dependent: :destroy
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
  has_many :push_subscriptions, dependent: :destroy
  accepts_nested_attributes_for :company_members, allow_destroy: true

  # Role validation
  ROLES = %w[admin company review].freeze
  enum status: { pending: 0, active: 1, rejected: 2, blocked: 3 }, _default: :pending

  validates :role, inclusion: { in: ROLES }, allow_nil: true
  validates :name, presence: true, length: { minimum: 3, maximum: 100 }
  validates :city, presence: true, if: -> { regular_user? && provider.blank? }
  validates :state, length: { is: 2 }, allow_blank: true
  validate :password_complexity
  validate :corporate_email_for_company, on: :create
  validate :adult_birthdate
  validate :validate_attachments
  validates :terms_accepted, acceptance: { accept: true }

  # Consent attribute getters/setters
  def public_name_consent?
    public_name_consent.present? && public_name_consent
  end

  def display_full_name_consent?
    display_full_name_consent.present? && display_full_name_consent
  end

  def review_name_consent?
    review_name_consent.present? && review_name_consent
  end

  def lgpd_name_consent?
    lgpd_name_consent.present? && lgpd_name_consent
  end

  # Display name logic
  def displayable_full_name?
    display_full_name_consent? && lgpd_name_consent?
  end

  # Validations for consent fields
  validates :public_name_consent, inclusion: { in: [true, false] }
  validates :display_full_name_consent, inclusion: { in: [true, false] }
  validates :review_name_consent, inclusion: { in: [true, false] }
  validates :lgpd_name_consent, inclusion: { in: [true, false] }
  validates :show_full_name, inclusion: { in: [true, false] }, allow_nil: true

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

  def avatar_url
    return unless avatar.attached?

    options = Rails.application.routes.default_url_options.dup
    options[:port] = 3001 if Rails.env.development? && options[:host] == 'localhost'

    Rails.application.routes.url_helpers.rails_storage_proxy_url(avatar, options)
  rescue StandardError
    nil
  end

  def active?
    return false unless active_status?
    return true if admin? || review_user?

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

  def owner_of?(company)
    (company.respond_to?(:owner_id) && company.owner_id == id) || company.company_members.exists?(user_id: id,
                                                                                                  role: 'owner')
  end

  # PostHog: unique identifier for this user across analytics events and error reports
  def posthog_distinct_id
    "user_#{id}"
  end

  # PostHog: person properties set on identify calls
  def posthog_properties
    {
      role: role,
      state: state,
      date_joined: created_at&.iso8601
    }
  end

  # Gamification
  def calculate_green_score
    Reviewer::GreenScoreService.new(user: self).call[:score]
  rescue StandardError => e
    Rails.logger.error("[GreenScore] unavailable user=#{id}: #{e.class}: #{e.message}")
    nil
  end

  def gamification_level
    score = calculate_green_score
    return nil if score.nil?

    if score >= 5000
      { key: 'platinum', name: 'Platina', next: nil, progress: 100, threshold: 5000 }
    elsif score >= 1500
      { key: 'gold', name: 'Ouro', next: 'Platina', progress: [((score - 1500).to_f / 3500 * 100).round, 0].max, threshold: 5000 }
    elsif score >= 500
      { key: 'silver', name: 'Prata', next: 'Ouro', progress: [((score - 500).to_f / 1000 * 100).round, 0].max, threshold: 1500 }
    elsif score >= 100
      { key: 'bronze', name: 'Bronze', next: 'Prata', progress: [((score - 100).to_f / 400 * 100).round, 0].max, threshold: 500 }
    else
      { key: 'beginner', name: 'Iniciante', next: 'Bronze', progress: [(score.to_f / 100 * 100).round, 0].max, threshold: 100 }
    end
  end

  def regional_ranking(score: nil)
    return nil if city.blank? || state.blank?

    ranking_score = score || calculate_green_score
    Rails.cache.fetch("user:#{id}:regional_ranking:#{ranking_score}", expires_in: 30.minutes) do
      users_in_region = User.where(city: city, state: state, role: 'review')
      my_score = ranking_score
      next nil if my_score.nil?

      review_counts = Review.where(user_id: users_in_region.select(:id), status: :approved).group(:user_id).count
      helpful_counts = ReviewVote.joins(:review)
                                 .where(reviews: { user_id: users_in_region.select(:id), status: :approved }, vote_type: 'useful')
                                 .group('reviews.user_id').count
      scores = users_in_region.pluck(:id, :name, :city, :state).to_h do |user_id, name, user_city, user_state|
        profile_points = [name, user_city, user_state].count(&:present?) * Reviewer::GreenScoreService::PROFILE_FIELD_POINTS
        [user_id, review_counts.fetch(user_id, 0) * Reviewer::GreenScoreService::REVIEW_POINTS + helpful_counts.fetch(user_id, 0) * Reviewer::GreenScoreService::USEFUL_VOTE_POINTS + profile_points]
      end
      scores.values.count { |score| score > my_score } + 1
    end
  rescue StandardError => e
    Rails.logger.error("[GreenScore] ranking unavailable user=#{id}: #{e.class}: #{e.message}")
    nil
  end

  def achievements
    Reviewer::AchievementService.new(user: self).call
  end

  # Envia notificações do Devise de forma assíncrona (TASK-014)
  def send_devise_notification(notification, *)
    devise_mailer.send(notification, self, *).deliver_later
  end

  # Override: Prevent confirmation email before admin approval for company users
  def send_confirmation_instructions
    return false if company_user? && !approved_by_admin?

    super
  end

  # Override: Skip confirmation notification for OAuth users
  def send_on_create_confirmation_instructions
    # return if provider.present? # Skip for OAuth users
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
    provider = auth.provider.to_s
    uid = auth.uid.to_s
    info = auth.info || {}

    email =
      if info.respond_to?(:email)
        info.email.to_s.downcase
      else
        info['email'].to_s.downcase
      end

    name_value =
      if info.respond_to?(:name)
        info.name
      else
        info['name']
      end

    candidate_name = name_value.presence || email.split('@').first.to_s.tr('_', ' ').strip
    default_name = case provider
                   when 'google_oauth2' then 'Usuario Google'
                   when 'linkedin' then 'Usuario LinkedIn'
                   when 'facebook' then 'Usuario Facebook'
                   else 'Usuario Social'
                   end
    name = candidate_name.length >= 3 ? candidate_name : default_name

    user = find_by(provider: provider, uid: uid)
    user ||= find_by(email: email) if email.present?
    user ||= new(provider: provider, uid: uid, email: email.presence)

    user.provider = provider
    user.uid = uid
    user.email = email if email.present? && user.email.blank?
    user.name = name if user.name.blank?
    user.password ||= "Aa1#{SecureRandom.base64(18)}"
    user.terms_accepted = true
    user.terms_accepted_at ||= Time.current
    user.confirmed_at ||= Time.current

    if user.new_record?
      user.skip_confirmation! if user.respond_to?(:skip_confirmation!)
      user.status = user.company_user? ? :pending : :active
    elsif user.respond_to?(:skip_confirmation!)
      user.skip_confirmation!
    end

    user.save!
    user
  end

  def display_name
    parts = name.to_s.strip.split(/\s+/)
    return name if parts.size <= 2

    "#{parts.first} #{parts.last}"
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
  rescue StandardError => e
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

  def corporate_email_for_company
    return unless company_user? && email.present?

    domain = email.to_s.downcase.split('@', 2).last
    errors.add(:email, 'deve ser corporativo para contas de empresa') if PUBLIC_EMAIL_DOMAINS.include?(domain)
  end

  def adult_birthdate
    return if date_of_birth.blank?

    errors.add(:date_of_birth, 'deve indicar 18+ anos') unless date_of_birth <= 18.years.ago.to_date
  end

  def mark_terms_accepted_at
    return unless terms_accepted_changed? && terms_accepted

    self.terms_accepted_at ||= Time.current
  end

  def validate_attachments
    return unless avatar.attached?

    errors.add(:avatar, 'deve ser JPG ou PNG') unless avatar.blob.content_type.in?(ALLOWED_AVATAR_CONTENT_TYPES)

    return unless avatar.blob.byte_size > MAX_AVATAR_SIZE_BYTES

    errors.add(:avatar, 'tamanho máximo é 5MB')
  end
end
