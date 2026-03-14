class TrustScoreRecalculationWorker
  include Sidekiq::Job

  sidekiq_options queue: 'default'

  # Minimum score change to trigger webhook notification
  SCORE_CHANGE_THRESHOLD = 5

  # Perform recalculation for a company (triggered by review changes, verification changes, etc.)
  # @param company_id [Integer] The company ID to recalculate
  # @param trigger [String] What triggered the recalculation (e.g., 'review', 'verification', 'badge')
  def perform(company_id, trigger = 'manual')
    company = Company.find_by(id: company_id)
    return unless company

    Rails.logger.info "[TrustScoreRecalculationWorker] Recalculating trust score for company #{company_id} (trigger: #{trigger})"

    result = TrustScore::CalculationService.new(company).calculate!

    # Upsert the trust score record
    CompanyTrustScore.upsert!(
      company_id: company.id,
      score: result[:score],
      components: result[:components],
      computed_at: Time.current,
      created_at: Time.current,
      updated_at: Time.current
    )

    # Trigger webhook if score changed significantly
    if result[:score_changed] && result[:previous_score].present?
      score_change = (result[:score] - result[:previous_score]).abs
      if score_change >= SCORE_CHANGE_THRESHOLD
        trigger_webhook(company, result, trigger)
      end
    end

    Rails.logger.info "[TrustScoreRecalculationWorker] Company #{company_id} trust score: #{result[:score]} (previous: #{result[:previous_score] || 'none'})"
  end

  # Class method to be called from model callbacks
  # @param company [Company] The company to recalculate
  # @param trigger [String] What triggered the recalculation
  def self.recalculate!(company, trigger = 'system')
    perform_async(company.id, trigger)
  end

  private

  def trigger_webhook(company, result, trigger)
    # Find active webhooks for this company
    webhooks = company.company_webhooks.active.where(event: 'trust_score_changed')
    
    webhooks.each do |webhook|
      begin
        HTTParty.post(
          webhook.url,
          body: {
            event: 'trust_score_changed',
            company_id: company.id,
            company_name: company.name,
            previous_score: result[:previous_score],
            current_score: result[:score],
            change: result[:score] - result[:previous_score],
            trigger: trigger,
            components: result[:components],
            timestamp: Time.current.iso8601
          }.to_json,
          headers: {
            'Content-Type' => 'application/json',
            'X-Webhook-Signature' => generate_signature(company, result)
          },
          timeout: 10
        )
      rescue => e
        Rails.logger.error "[TrustScoreRecalculationWorker] Webhook failed for company #{company.id}: #{e.message}"
      end
    end
  end

  def generate_signature(company, result)
    # Generate HMAC signature for webhook verification
    payload = "#{company.id}#{result[:score]}#{Time.current.to_i}"
    OpenSSL::HMAC.hexdigest(OpenSSL::Digest.new('sha256'), ENV.fetch('WEBHOOK_SECRET', 'secret'), payload)
  end
end
