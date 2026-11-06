class BuyerIntentActivity < ApplicationRecord
  belongs_to :company
  belongs_to :user, optional: true

  # Versioned source of accepted company-scoped intent events. Market-wide
  # category/search events must use a separate scope, not an invented company.
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
    bill_value_entered
    financing_multiple_simulations
    contact_info_reveal
    quote_abandonment
    return_visit_to_company
    whatsapp_copy
    quote_wizard_step
    quote_submission
    comparison_third_added
    negative_review_deep_read
    certification_hover
    payback_period_interaction
    photo_gallery_5plus
    time_on_company_5min
    geo_filter_repeated
    tab_switching_pattern
    roi_calculator_opened
    search_refinement_chain
    category_return
    exit_intent
    scroll_depth_80pct
    share_intent
    mobile_contact_tap
    idle_then_return
    social_proof_section_dwell
    faq_specific_read
    blog_exit_intent
    blog_share_intent
    blog_newsletter_intent
    blog_cta_click
    blog_toc_click
    blog_category_filter
    blog_search_performed
    blog_related_post_click
    blog_idle_return
    profile_view
    category_view
    alternatives_view
    sponsored_view
    licensed_content_view
    reference_project_view
    competitive_view
    product_view
    contact_clicked
    quote_started
    material_section_view
    material_delivered
    section_engaged
    portfolio_view
    review_section_view
    contact_section_view
    datasheet_section_view
    comparison_started
  ].freeze

  SIGNAL_CATEGORIES = %w[
    micro_interaction
    financial_intent
    research_intent
    contact_intent
    blog_engagement
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
    'document_download' => 6,
    'profile_view' => 2,
    'category_view' => 2,
    'alternatives_view' => 5,
    'sponsored_view' => 1,
    'licensed_content_view' => 4,
    'reference_project_view' => 4,
    'competitive_view' => 5,
    'product_view' => 3,
    'contact_clicked' => 8,
    'quote_started' => 7,
    'material_section_view' => 2,
    'material_delivered' => 6,
    'section_engaged' => 2,
    'portfolio_view' => 3,
    'review_section_view' => 2,
    'contact_section_view' => 2,
    'datasheet_section_view' => 2,
    'comparison_started' => 4,
    'bill_value_entered' => 6,
    'financing_multiple_simulations' => 6,
    'contact_info_reveal' => 6,
    'quote_abandonment' => 2,
    'return_visit_to_company' => 4,
    'whatsapp_copy' => 7,
    'quote_wizard_step' => 5,
    'quote_submission' => 10,
    'comparison_third_added' => 5,
    'negative_review_deep_read' => 5,
    'certification_hover' => 2,
    'payback_period_interaction' => 6,
    'photo_gallery_5plus' => 3,
    'time_on_company_5min' => 2,
    'geo_filter_repeated' => 3,
    'tab_switching_pattern' => 2,
    'roi_calculator_opened' => 4,
    'search_refinement_chain' => 4,
    'category_return' => 3,
    'exit_intent' => 1,
    'scroll_depth_80pct' => 2,
    'share_intent' => 3,
    'mobile_contact_tap' => 7,
    'idle_then_return' => 1,
    'social_proof_section_dwell' => 2,
    'faq_specific_read' => 3,
    'blog_exit_intent' => 1,
    'blog_share_intent' => 2,
    'blog_newsletter_intent' => 2,
    'blog_cta_click' => 4,
    'blog_toc_click' => 1,
    'blog_category_filter' => 1,
    'blog_search_performed' => 2,
    'blog_related_post_click' => 2,
    'blog_idle_return' => 1
  }.freeze

  validates :event_id, uniqueness: { scope: :company_id }, allow_nil: true
  validates :event_id, length: { maximum: 128 }, allow_nil: true
  validates :duration_ms, numericality: { greater_than_or_equal_to: 0, less_than_or_equal_to: 3_600_000 }, allow_nil: true
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
  before_validation :ensure_event_id, on: :create

  def hot_signal?
    intent_weight.to_i >= 5
  end

  private

  def ensure_event_id
    self.event_id ||= SecureRandom.uuid
  end

  def set_intent_weight
    self.intent_weight ||= INTENT_WEIGHTS[signal_type] || 1
  end
end
