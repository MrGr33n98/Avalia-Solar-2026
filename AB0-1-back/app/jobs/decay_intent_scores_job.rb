class DecayIntentScoresJob < ApplicationJob
  queue_as :default
  retry_on StandardError, wait: 1.minute, attempts: 3

  def perform
    Rails.logger.info('[DecayIntentScoresJob] Starting decay recalculation')

    # Find all scores that haven't been updated in 24h
    stale_scores = IntentScore.stale.select(:id, :company_id, :lead_id, :anonymous_id)

    Rails.logger.info("[DecayIntentScoresJob] Found #{stale_scores.size} stale scores")

    recalculated = 0

    stale_scores.find_each(batch_size: 100) do |score|
      IntentScoringService.new(
        score.company_id,
        lead_id: score.lead_id,
        anonymous_id: score.anonymous_id
      ).calculate!

      recalculated += 1
    rescue StandardError => e
      Rails.logger.error("[DecayIntentScoresJob] Error on score #{score.id}: #{e.message}")
    end

    Rails.logger.info("[DecayIntentScoresJob] ✓ Recalculated #{recalculated}/#{stale_scores.size} scores")
  end
end
