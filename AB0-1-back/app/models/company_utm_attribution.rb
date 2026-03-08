# frozen_string_literal: true

# app/models/company_utm_attribution.rb
# Tracks campaign performance via UTM parameters

class CompanyUtmAttribution < ApplicationRecord
  belongs_to :company

  validates :utm_source, presence: true
  validates :company_id, presence: true
  validates :company_id, uniqueness: { 
    scope: [:utm_source, :utm_medium, :utm_campaign],
    message: 'UTM combination already exists for this company'
  }

  scope :recent, -> { where('last_seen_at >= ?', 30.days.ago) }
  scope :by_leads, -> { order(total_leads: :desc) }
  scope :by_visits, -> { order(total_visits: :desc) }
  scope :by_conversion_rate, -> { where('total_visits > 0').order(conversion_rate: :desc) }
  
  scope :for_campaign, ->(campaign) { where(utm_campaign: campaign) }
  scope :for_source, ->(source) { where(utm_source: source) }
  scope :for_medium, ->(medium) { where(utm_medium: medium) }

  # Calculate and update conversion rate
  def update_conversion_rate!
    self.conversion_rate = if total_visits.positive?
                             ((total_leads.to_f / total_visits) * 100).round(2)
                           else
                             0.0
                           end
    save! if changed?
  end

  # Increment metrics
  def increment_visit!
    increment!(:total_visits)
    touch(:last_seen_at)
    update_conversion_rate!
  end

  def increment_cta_click!(cta_type)
    increment!(:total_cta_clicks)
    
    case cta_type.to_s
    when 'whatsapp'
      increment!(:whatsapp_clicks)
    when 'email'
      increment!(:email_clicks)
    when 'phone'
      increment!(:phone_clicks)
    when 'website'
      increment!(:website_clicks)
    end
    
    touch(:last_seen_at)
  end

  def increment_lead!
    increment!(:total_leads)
    touch(:last_seen_at)
    update_conversion_rate!
  end

  # Campaign identifier
  def campaign_name
    utm_campaign || "#{utm_source}/#{utm_medium}"
  end

  # Full UTM string
  def utm_string
    [
      "utm_source=#{utm_source}",
      utm_medium && "utm_medium=#{utm_medium}",
      utm_campaign && "utm_campaign=#{utm_campaign}",
      utm_content && "utm_content=#{utm_content}",
      utm_term && "utm_term=#{utm_term}"
    ].compact.join('&')
  end

  # ROI calculation (when revenue tracking is implemented)
  def roi
    return 0.0 if attributed_revenue.zero?
    # Placeholder: need to track campaign cost
    # roi = ((revenue - cost) / cost) * 100
    0.0
  end

  # CTR (Click-Through Rate)
  def ctr
    return 0.0 if total_visits.zero?
    ((total_cta_clicks.to_f / total_visits) * 100).round(2)
  end

  # Average CTAs per visitor
  def avg_ctas_per_visitor
    return 0.0 if total_visits.zero?
    (total_cta_clicks.to_f / total_visits).round(2)
  end
end
