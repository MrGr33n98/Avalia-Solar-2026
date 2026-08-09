# frozen_string_literal: true

class ChatLead < ApplicationRecord
  belongs_to :chat_session
  belongs_to :assigned_company, class_name: 'Company', optional: true
  has_many :chat_lead_activities, dependent: :destroy

  SALES_STATUSES = %w[new qualified contacted proposal_sent converted lost spam].freeze
  TEMPERATURES = %w[frio morno quente muito_quente].freeze
  VERTICALS = %w[solar electric_mobility].freeze
  INTENTS = %w[
    solar_quote solar_financing solar_maintenance company_recommendation compare_companies
    ev_charger_installation condominium_charging fleet_electrification charging_station
    general_question
  ].freeze

  validates :consent_given, inclusion: { in: [true] }, on: :create
  validates :consent_given_at, presence: true, if: :consent_given?
  validates :sales_status, inclusion: { in: SALES_STATUSES }
  validates :lead_temperature, inclusion: { in: TEMPERATURES }

  before_validation :sanitize_contact_fields
  before_validation :calculate_score, if: :scoring_inputs_changed?
  after_commit :notify_slack_new_lead, on: :create
  after_commit :log_status_change_activity, on: :update, if: :saved_change_to_sales_status?

  scope :recent, -> { order(created_at: :desc) }
  scope :hot, -> { where(lead_temperature: %w[quente muito_quente]) }
  scope :by_vertical, ->(v) { where(vertical: v) if v.present? }
  scope :by_status, ->(s) { where(sales_status: s) if s.present? }
  scope :by_city, ->(c) { where(city: c) if c.present? }
  scope :by_state, ->(s) { where(state: s) if s.present? }
  scope :not_spam, -> { where.not(sales_status: 'spam') }
  scope :actionable, -> { where(sales_status: %w[new qualified]) }

  def self.ransackable_attributes(_auth_object = nil)
    %w[
      id chat_session_id name email phone city state vertical intent
      project_type monthly_bill lead_score lead_temperature sales_status
      consent_given source_page utm_source utm_medium utm_campaign
      recommended_next_action created_at updated_at
    ]
  end

  def self.ransackable_associations(_auth_object = nil)
    %w[chat_session chat_lead_activities]
  end

  def change_status!(new_status, performed_by: nil, notes: nil)
    old = sales_status
    update!(sales_status: new_status)
    chat_lead_activities.create!(
      activity_type: 'status_change',
      description: notes || "Status alterado de #{old} para #{new_status}",
      old_status: old,
      new_status: new_status,
      performed_by_id: performed_by&.id
    )
  end

  def temperature_emoji
    case lead_temperature
    when 'muito_quente' then '🔥🔥'
    when 'quente' then '🔥'
    when 'morno' then '🌡️'
    else '❄️'
    end
  end

  SCORING_ATTRIBUTES = %w[
    vertical
    city
    state
    name
    phone
    consent_given
    intent
    metadata
    monthly_bill
    urgency
    decision_timeline
    property_type
    vehicle_count
  ].freeze

  private

  def sanitize_contact_fields
    self.name = name.to_s.strip if name.present?
    self.email = email.to_s.strip.downcase if email.present?
    self.phone = phone.to_s.gsub(/\D/, '') if phone.present?
  end

  def scoring_inputs_changed?
    new_record? ||
      SCORING_ATTRIBUTES.any? do |attribute|
        will_save_change_to_attribute?(attribute)
      end
  end

  def calculate_score
    result = Chat::LeadScoringService.calculate(self)
    calculated_score = result[:total_score]
    calculated_temperature = Chat::LeadScoringService.temperature_for(calculated_score)

    self.lead_score = calculated_score
    self.intent_score = result[:intent_score] if respond_to?(:intent_score=)
    self.fit_score = result[:fit_score] if respond_to?(:fit_score=)
    self.score_explanation = result[:explanation] if respond_to?(:score_explanation=)
    self.lead_temperature = Chat::LeadTemperature.normalize(calculated_temperature)
  end

  # rubocop:disable Metrics/CyclomaticComplexity
  def notify_slack_new_lead
    SlackNotificationService.notify(
      "🤖 *Novo Lead via Chat IA!* #{temperature_emoji}",
      [{
        color: lead_temperature == 'muito_quente' ? '#ff4500' : '#36a64f',
        fields: [
          { title: 'Nome', value: name || 'Anônimo', short: true },
          { title: 'Telefone', value: phone || 'N/A', short: true },
          { title: 'Cidade', value: [city, state].compact.join('/'), short: true },
          { title: 'Vertical', value: vertical || 'N/A', short: true },
          { title: 'Intenção', value: intent || 'N/A', short: true },
          { title: 'Score', value: "#{lead_score} (#{lead_temperature})", short: true },
          { title: 'Próxima Ação', value: recommended_next_action || 'N/A', short: false },
          { title: 'Resumo', value: summary.to_s.truncate(300), short: false }
        ],
        footer: "ChatLead ID: #{id} | Origem: #{source_page}"
      }],
      channel: :leads
    )
  rescue StandardError => e
    Rails.logger.warn("[ChatLead] Slack notification failed: #{e.message}")
  end
  # rubocop:enable Metrics/CyclomaticComplexity

  def log_status_change_activity
    old_status, new_status = saved_change_to_sales_status
    chat_lead_activities.create!(
      activity_type: 'status_change',
      description: "Status alterado automaticamente de #{old_status} para #{new_status}",
      old_status: old_status,
      new_status: new_status
    )
  rescue StandardError => e
    Rails.logger.warn("[ChatLead] Failed to log activity: #{e.message}")
  end
end
