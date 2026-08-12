class Campaign < ApplicationRecord
  belongs_to :company, optional: true
  has_many :campaign_reviews
  has_one_attached :image

  validates :name, presence: true
  validates :priority, numericality: { only_integer: true, greater_than_or_equal_to: 0 }, allow_nil: true
  validate :end_date_after_start_date

  after_commit :broadcast_and_cache_active_campaign

  # Add these methods for Ransack
  def self.ransackable_attributes(_auth_object = nil)
    %w[budget created_at description end_date id name start_date updated_at company_id priority target_url]
  end

  def self.ransackable_associations(_auth_object = nil)
    %w[campaign_reviews company image_attachment image_blob]
  end

  def image_url
    return nil unless image.attached?
    Rails.application.routes.url_helpers.rails_storage_proxy_url(image, safe_url_options)
  rescue StandardError
    nil
  end

  def self.active_campaign
    currently_active.order(priority: :desc, budget: :desc, created_at: :desc).first
  end

  scope :currently_active, -> {
    where('start_date IS NULL OR start_date <= ?', Date.today)
      .where('end_date IS NULL OR end_date >= ?', Date.today)
  }

  private

  def end_date_after_start_date
    return if start_date.blank? || end_date.blank?
    if end_date < start_date
      errors.add(:end_date, "deve ser posterior à data de início")
    end
  end

  def safe_url_options
    opts = Rails.application.routes.default_url_options || {}
    return opts.slice(:host, :protocol, :port) if opts[:host].present?

    app_host = ENV.fetch('APP_HOST', 'http://localhost:3001')
    uri = URI(app_host)
    {
      host: uri.host || app_host,
      protocol: uri.scheme || 'http',
      port: uri.port && ![80, 443].include?(uri.port) ? uri.port : nil
    }.compact
  rescue StandardError
    { host: 'localhost', protocol: 'http' }
  end

  def broadcast_and_cache_active_campaign
    active = self.class.active_campaign
    if active
      payload = {
        id: active.id,
        name: active.name,
        description: active.description,
        target_url: active.target_url,
        budget: active.budget.to_f,
        company: active.company ? { id: active.company.id, name: active.company.name } : nil,
        image_url: active.image_url
      }
    else
      payload = nil
    end

    Rails.cache.write("publicidade:campanha_ativa", payload)
    ActionCable.server.broadcast("advertising_channel", payload)
  rescue => e
    Rails.logger.error("[Campaign#broadcast_and_cache_active_campaign] Error: #{e.message}")
  end
end
