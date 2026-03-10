class MicroInteractionValidator
  VALID_ACTIONS = %w[
    form_hesitation
    hover_intent
    copy_clipboard
    scroll_pause
    tooltip_open
  ].freeze

  VALID_ELEMENT_TYPES = %w[
    form_field
    cta_button
    content_section
    tooltip
    cnpj
    phone
    email
    unknown
  ].freeze

  def initialize(event_data)
    @data = event_data.with_indifferent_access
    @errors = []
  end

  def valid?
    validate_action
    validate_element_type
    validate_duration
    validate_context
    @errors.empty?
  end

  def errors
    @errors
  end

  private

  def validate_action
    action = @data.dig(:context, :action) || @data[:action]
    return if action.blank? || VALID_ACTIONS.include?(action.to_s)
    
    @errors << "Invalid action: #{action}"
  end

  def validate_element_type
    element_type = @data.dig(:context, :element_type)
    return if element_type.blank? || VALID_ELEMENT_TYPES.include?(element_type.to_s)
    
    @errors << "Invalid element_type: #{element_type}"
  end

  def validate_duration
    duration = @data.dig(:context, :duration_ms)
    return unless duration
    return if duration.is_a?(Integer) && duration.positive?
    
    @errors << "Invalid duration_ms: #{duration}"
  end

  def validate_context
    context = @data[:context]
    return if context.is_a?(Hash)
    
    @errors << "Missing or invalid context object"
  end
end
