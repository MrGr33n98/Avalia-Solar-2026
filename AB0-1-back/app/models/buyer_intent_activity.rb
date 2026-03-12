class BuyerIntentActivity < ApplicationRecord
  belongs_to :company
  belongs_to :user, optional: true

  SIGNAL_TYPES = %w[
    hover_intent
    copy_clipboard
    form_hesitation
    scroll_pause
    tooltip_interaction
    faq_interaction
    search_query
    comparison_view
    comparison_usage
    calculator_usage
    product_search
    review_read
    review_deep_read
    phone_hover
    whatsapp_hover
    pricing_interaction
    document_download
  ].freeze

  SIGNAL_CATEGORIES = %w[
    micro_interaction
    financial_intent
    research_intent
    contact_intent
  ].freeze

  INTENT_WEIGHTS = {
    'hover_intent' => 2,
    'scroll_pause' => 2,
    'tooltip_interaction' => 3,
    'faq_interaction' => 4,
    'search_query' => 4,
    'copy_clipboard' => 5,
    'form_hesitation' => 4,
    'comparison_view' => 6,
    'comparison_usage' => 6,
    'product_search' => 5,
    'review_read' => 4,
    'review_deep_read' => 5,
    'calculator_usage' => 7,
    'phone_hover' => 6,
    'whatsapp_hover' => 7,
    'pricing_interaction' => 8,
    'document_download' => 6
  }.freeze

  validates :company, presence: true
  validates :signal_type, presence: true, inclusion: { in: SIGNAL_TYPES }
  validates :signal_category, presence: true, inclusion: { in: SIGNAL_CATEGORIES }
  validates :session_id, presence: true
  validates :page_path, presence: true
  validates :tracked_at, presence: true
  validates :intent_weight,
            numericality: {
              only_integer: true,
              greater_than_or_equal_to: 1,
              less_than_or_equal_to: 10
            }

  scope :by_company, ->(company_id) { where(company_id: company_id) }
  scope :recent, ->(hours = 24) { where('tracked_at > ?', hours.hours.ago) }
  scope :hot_signals, -> { where('intent_weight >= ?', 5) }
  scope :by_category, ->(category) { where(signal_category: category) }

  before_validation :set_intent_weight, on: :create

  def hot_signal?
    intent_weight.to_i >= 5
  end

  private

  def set_intent_weight
    self.intent_weight ||= INTENT_WEIGHTS[signal_type] || 1
  end
end
