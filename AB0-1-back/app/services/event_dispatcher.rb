class EventDispatcher
  def self.dispatch(name, _start, _finish, _id, payload)
    new(name, payload).call
  end

  def initialize(name, payload)
    @name = name
    @payload = payload
  end

  def call
    case @name
    when 'review.published'
      TrustScoreRecalculationWorker.perform_async(@payload[:review_id])
      AiModerationWorker.perform_async(@payload[:review_id])
    when 'lead.captured'
      RoiCalculationWorker.perform_async(@payload[:lead_id])
      LeadScoringWorker.perform_async(@payload[:lead_id])
      # FinancingMatchWorker.perform_async(@payload[:lead_id]) # Pending implementation
    end
  end
end
