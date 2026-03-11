class IntentScoringService
  SCORING_VERSION = 'v1'.freeze
  DECAY_HALF_LIFE_DAYS = 7 # Score decays 50% every 7 days

  # Score weights by category
  CATEGORY_WEIGHTS = {
    'micro_interaction' => 0.15,
    'research_intent' => 0.20,
    'financial_intent' => 0.30,
    'contact_intent' => 0.35
  }.freeze

  CATEGORY_SCORE_MULTIPLIERS = {
    'micro_interaction' => 3.0,
    'research_intent' => 4.0,
    'financial_intent' => 5.0,
    'contact_intent' => 6.0
  }.freeze

  def initialize(company_id, lead_id: nil, anonymous_id: nil)
    @company_id = company_id
    @lead_id = lead_id.presence
    @anonymous_id = anonymous_id.presence
  end

  def calculate!
    score = find_or_create_score
    activities = gather_activities

    return reset_score!(score) if activities.empty?

    category_scores = calculate_category_scores(activities)
    decay_factor = calculate_decay_factor(activities.first.tracked_at)
    raw_score = calculate_raw_score(category_scores, activities)
    decayed_score = normalize_score(raw_score * decay_factor)
    confidence = calculate_confidence(activities, decay_factor)
    breakdown = build_breakdown(activities, category_scores, decay_factor, confidence, raw_score)

    score.update!(
      total_score: decayed_score,
      micro_interaction_score: category_scores['micro_interaction'],
      research_intent_score: category_scores['research_intent'],
      financial_intent_score: category_scores['financial_intent'],
      contact_intent_score: category_scores['contact_intent'],
      total_signals_count: activities.size,
      hot_signals_count: activities.count(&:hot_signal?),
      unique_sessions_count: activities.map(&:session_id).compact.uniq.size,
      unique_pages_count: activities.map(&:page_path).compact.uniq.size,
      first_interaction_at: activities.last.tracked_at,
      last_interaction_at: activities.first.tracked_at,
      last_hot_signal_at: activities.find(&:hot_signal?)&.tracked_at,
      days_active: calculate_days_active(activities),
      decay_factor: decay_factor,
      confidence_score: confidence,
      scoring_version: SCORING_VERSION,
      score_breakdown: breakdown,
      top_signals: extract_top_signals(activities)
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

  def gather_activities
    scope = BuyerIntentActivity.by_company(@company_id)

    if @lead_id
      scope = scope.where(user_id: @lead_id)
    elsif @anonymous_id
      scope = scope.where(anonymous_id: @anonymous_id)
    end

    scope.where('tracked_at >= ?', 90.days.ago)
         .order(tracked_at: :desc)
         .to_a
  end

  def reset_score!(score)
    score.update!(
      total_score: 0,
      micro_interaction_score: 0,
      research_intent_score: 0,
      financial_intent_score: 0,
      contact_intent_score: 0,
      total_signals_count: 0,
      hot_signals_count: 0,
      unique_sessions_count: 0,
      unique_pages_count: 0,
      first_interaction_at: nil,
      last_interaction_at: nil,
      last_hot_signal_at: nil,
      days_active: 0,
      decay_factor: 0.0,
      confidence_score: 0.0,
      scoring_version: SCORING_VERSION,
      score_breakdown: {
        category_scores: CATEGORY_WEIGHTS.keys.index_with(0),
        raw_score: 0,
        total_signals: 0,
        scoring_version: SCORING_VERSION
      },
      top_signals: []
    )

    score
  end

  def calculate_category_scores(activities)
    scores = CATEGORY_WEIGHTS.keys.index_with(0)

    activities.group_by(&:signal_category).each do |category, grouped_activities|
      multiplier = CATEGORY_SCORE_MULTIPLIERS.fetch(category, 3.0)
      base_score = grouped_activities.sum(&:intent_weight).to_f * multiplier
      frequency_bonus = [grouped_activities.size - 1, 0].max * 3.0
      diversity_bonus = grouped_activities.map(&:signal_type).uniq.size * 2.0
      duration_bonus = grouped_activities.filter_map(&:duration_ms).sum / 5_000.0

      scores[category] = [base_score + frequency_bonus + diversity_bonus + duration_bonus, 100.0].min.round
    end

    scores
  end

  def calculate_decay_factor(last_tracked_at)
    days_since = ((Time.current - last_tracked_at) / 1.day).to_f
    Math.exp(-0.693 * days_since / DECAY_HALF_LIFE_DAYS).clamp(0.0, 1.0)
  end

  def calculate_raw_score(category_scores, activities)
    weighted_score = CATEGORY_WEIGHTS.sum do |category, weight|
      category_scores.fetch(category, 0).to_f * weight
    end

    bonus = 0.0
    bonus += 5.0 if activities.size >= 4
    bonus += 5.0 if calculate_days_active(activities) >= 2
    bonus += 10.0 if category_scores.fetch('contact_intent', 0) >= 50
    bonus += 10.0 if category_scores.fetch('contact_intent', 0) >= 40 && category_scores.fetch('financial_intent', 0) >= 30

    [weighted_score + bonus, 100.0].min
  end

  def calculate_confidence(activities, decay_factor)
    signal_confidence = [activities.size / 10.0, 1.0].min
    recency_confidence = decay_factor
    diversity_confidence = [activities.map(&:signal_type).uniq.size / 4.0, 1.0].min
    consistency_confidence = [calculate_days_active(activities) / 3.0, 1.0].min

    (
      (signal_confidence * 0.4) +
      (diversity_confidence * 0.3) +
      (recency_confidence * 0.2) +
      (consistency_confidence * 0.1)
    ).round(2)
  end

  def normalize_score(score)
    score.round.clamp(0, 100)
  end

  def calculate_days_active(activities)
    activities.map { |activity| activity.tracked_at.to_date }.uniq.size
  end

  def build_breakdown(activities, category_scores, decay_factor, confidence, raw_score)
    {
      category_scores: category_scores,
      raw_score: raw_score.round(2),
      decay_factor: decay_factor,
      confidence_score: confidence,
      signal_counts: {
        total: activities.size,
        hot: activities.count(&:hot_signal?),
        by_type: activities.group_by(&:signal_type).transform_values(&:size),
        by_category: activities.group_by(&:signal_category).transform_values(&:size)
      },
      timeline: {
        first: activities.last.tracked_at.iso8601,
        last: activities.first.tracked_at.iso8601,
        days_active: calculate_days_active(activities)
      },
      scoring_version: SCORING_VERSION
    }
  end

  def extract_top_signals(activities)
    activities.sort_by { |activity| [-activity.intent_weight.to_i, -activity.tracked_at.to_i] }
              .first(10)
              .map do |activity|
      {
        signal_type: activity.signal_type,
        signal_category: activity.signal_category,
        intent_weight: activity.intent_weight,
        element_type: activity.element_type,
        page_path: activity.page_path,
        duration_ms: activity.duration_ms,
        tracked_at: activity.tracked_at.iso8601
      }
    end
  end
end
