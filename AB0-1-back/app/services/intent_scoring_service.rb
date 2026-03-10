class IntentScoringService
  DECAY_HALF_LIFE_DAYS = 7 # Score decays 50% every 7 days
  
  # Score weights by category
  CATEGORY_WEIGHTS = {
    micro_interaction: 0.15,  # 15%
    research_intent: 0.25,    # 25%
    financial_intent: 0.30,   # 30%
    contact_intent: 0.30      # 30%
  }.freeze

  def initialize(company_id, lead_id: nil, anonymous_id: nil)
    @company_id = company_id
    @lead_id = lead_id
    @anonymous_id = anonymous_id
    @company = Company.find(@company_id)
  end

  def calculate!
    # Find or create intent score
    score = find_or_create_score
    
    # Gather all signals
    signals = gather_signals
    
    return score if signals.empty?

    # Calculate category scores
    category_scores = calculate_category_scores(signals)
    
    # Calculate temporal decay
    decay_factor = calculate_decay_factor(signals)
    
    # Calculate total score (0-100)
    raw_score = calculate_raw_score(category_scores)
    decayed_score = (raw_score * decay_factor).round.clamp(0, 100)
    
    # Calculate confidence
    confidence = calculate_confidence(signals, decay_factor)
    
    # Build breakdown
    breakdown = build_breakdown(signals, category_scores, decay_factor)
    
    # Update score
    score.update!(
      total_score: decayed_score,
      micro_interaction_score: category_scores[:micro_interaction],
      research_intent_score: category_scores[:research_intent],
      financial_intent_score: category_scores[:financial_intent],
      contact_intent_score: category_scores[:contact_intent],
      total_signals_count: signals.size,
      hot_signals_count: signals.count { |s| s.intent_weight >= 5 },
      unique_sessions_count: signals.pluck(:session_id).compact.uniq.size,
      unique_pages_count: signals.pluck(:page_url).compact.uniq.size,
      first_interaction_at: signals.minimum(:tracked_at),
      last_interaction_at: signals.maximum(:tracked_at),
      last_hot_signal_at: signals.where('intent_weight >= 5').maximum(:tracked_at),
      days_active: calculate_days_active(signals),
      decay_factor: decay_factor,
      confidence_score: confidence,
      score_breakdown: breakdown,
      top_signals: extract_top_signals(signals)
    )
    
    score
  end

  private

  def find_or_create_score
    if @lead_id
      IntentScore.find_or_create_by!(company_id: @company_id, lead_id: @lead_id)
    elsif @anonymous_id
      IntentScore.find_or_create_by!(company_id: @company_id, anonymous_id: @anonymous_id)
    else
      raise ArgumentError, 'Must provide lead_id or anonymous_id'
    end
  end

  def gather_signals
    scope = AnalyticsEvent.where(company_id: @company_id)
    
    if @lead_id
      scope = scope.where(user_id: @lead_id)
    elsif @anonymous_id
      scope = scope.where(anonymous_id: @anonymous_id)
    end
    
    # Get last 90 days of signals
    scope.where('tracked_at >= ?', 90.days.ago)
         .where(event_type: 'micro_interaction')
         .order(tracked_at: :desc)
  end

  def calculate_category_scores(signals)
    scores = {
      micro_interaction: 0,
      research_intent: 0,
      financial_intent: 0,
      contact_intent: 0
    }
    
    signals.each do |signal|
      category = categorize_signal(signal)
      weight = signal.duration_ms ? calculate_duration_weight(signal.duration_ms) : 5
      
      scores[category] += weight
    end
    
    # Normalize to 0-100 per category
    scores.transform_values! { |v| [v, 100].min }
    
    scores
  end

  def categorize_signal(signal)
    case signal.action
    when 'form_hesitation', 'hover_intent', 'scroll_pause', 'tooltip_open'
      :micro_interaction
    when 'copy_clipboard'
      signal.element_type == 'cnpj' ? :financial_intent : :contact_intent
    when 'calculator_usage', 'pricing_view'
      :financial_intent
    when 'comparison_created', 'filter_applied'
      :research_intent
    else
      :micro_interaction
    end
  end

  def calculate_duration_weight(duration_ms)
    # More time = more intent
    case duration_ms
    when 0..1000 then 1
    when 1001..3000 then 2
    when 3001..10_000 then 5
    when 10_001..30_000 then 8
    else 10
    end
  end

  def calculate_decay_factor(signals)
    return 1.0 if signals.empty?
    
    last_signal = signals.maximum(:tracked_at)
    days_since = ((Time.current - last_signal) / 1.day).to_i
    
    # Exponential decay: factor = 0.5 ^ (days / half_life)
    Math.exp(-0.693 * days_since / DECAY_HALF_LIFE_DAYS).clamp(0.0, 1.0)
  end

  def calculate_raw_score(category_scores)
    total = 0
    
    CATEGORY_WEIGHTS.each do |category, weight|
      total += category_scores[category] * weight
    end
    
    total.round
  end

  def calculate_confidence(signals, decay_factor)
    # Confidence based on:
    # 1. Number of signals (more = better)
    # 2. Recency (recent = better via decay_factor)
    # 3. Diversity (different actions = better)
    
    signal_confidence = [signals.size / 10.0, 1.0].min # Max at 10 signals
    recency_confidence = decay_factor
    diversity_confidence = [signals.pluck(:action).uniq.size / 5.0, 1.0].min # Max at 5 unique actions
    
    ((signal_confidence + recency_confidence + diversity_confidence) / 3.0).round(2)
  end

  def calculate_days_active(signals)
    signals.pluck(:tracked_at).map(&:to_date).uniq.size
  end

  def build_breakdown(signals, category_scores, decay_factor)
    {
      category_scores: category_scores,
      decay_factor: decay_factor,
      signal_counts: {
        total: signals.size,
        by_action: signals.group(:action).count,
        by_element: signals.group(:element_type).count
      },
      timeline: {
        first: signals.minimum(:tracked_at)&.iso8601,
        last: signals.maximum(:tracked_at)&.iso8601,
        days_active: calculate_days_active(signals)
      }
    }
  end

  def extract_top_signals(signals)
    signals.order(duration_ms: :desc, tracked_at: :desc)
           .limit(10)
           .map do |s|
      {
        action: s.action,
        element_type: s.element_type,
        element_id: s.element_id,
        duration_ms: s.duration_ms,
        tracked_at: s.tracked_at.iso8601
      }
    end
  end
end
