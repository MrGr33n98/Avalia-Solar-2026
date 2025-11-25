class Company < ApplicationRecord
  # =========================
  # Attachments
  # =========================
  has_one_attached :banner
  has_one_attached :logo

  # =========================
  # Associations
  # =========================
  has_and_belongs_to_many :categories, join_table: :categories_companies
  has_many :reviews, dependent: :destroy

  # =========================
  # Validations
  # =========================
  validates :name, :description, presence: true
  validates :website,
            format: { with: URI::DEFAULT_PARSER.make_regexp(%w[http https]),
                      message: 'must be a valid URL' },
            allow_blank: true
  validates :phone,
            format: { with: /\A\([0-9]{2}\)\s[0-9]{4,5}-[0-9]{4}\z/,
                      message: 'must be in format (XX) XXXX-XXXX or (XX) XXXXX-XXXX' },
            allow_blank: true
  validates :whatsapp,
            format: { with: /\A\+?[0-9]{10,15}\z/,
                      message: 'must be a valid WhatsApp number' },
            allow_blank: true
  validates :email_public,
            format: { with: URI::MailTo::EMAIL_REGEXP,
                      message: 'must be a valid email' },
            allow_blank: true

  # =========================
  # Scopes
  # =========================
  scope :by_state,        ->(state) { where(state:) if state.present? }
  scope :by_city,         ->(city)  { where(city:) if city.present? }
  scope :featured,        ->        { where(featured: true) }
  scope :verified,        ->        { where(verified: true) }
  scope :by_rating,       ->        { order(rating_avg: :desc) }
  scope :by_founded_year, ->        { order(founded_year: :asc) }

  # =========================
  # Ransack configuration
  # =========================
  def self.ransackable_attributes(_auth_object = nil)
    %w[
      id name description website phone address state city
      featured verified cnpj email_public instagram facebook linkedin
      working_hours payment_methods certifications status
      founded_year employees_count rating_avg rating_count
      created_at updated_at
    ]
  end

  def self.ransackable_associations(_auth_object = nil)
    %w[categories reviews]
  end

  # =========================
  # Domain / API helpers
  # =========================
  def average_rating
    rating_avg.presence || reviews.average(:rating).to_f.round(1)
  end

  def reviews_count
    rating_count.presence || reviews.count
  end

  def years_in_business
    return nil unless founded_year.present?

    Time.current.year - founded_year
  end

  def build_ctas(context = 'detail', utm = {}, vars = {})
    CompanyCtaBuilder.new(self, context, utm, vars).build_all_ctas
  end

  def social_links
    {
      facebook: facebook_url,
      instagram: instagram_url,
      linkedin: linkedin_url,
      youtube: youtube_url
    }.compact.presence
  end
end
