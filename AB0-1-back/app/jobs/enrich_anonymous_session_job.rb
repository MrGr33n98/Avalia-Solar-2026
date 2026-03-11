class EnrichAnonymousSessionJob < ApplicationJob
  queue_as :low

  def perform(anonymous_session_id)
    session = AnonymousSession.find_by(id: anonymous_session_id)
    return if session.blank? || session.enriched? || session.ip_hash.blank?

    enriched_data = fetch_firmographic_data_mock(session.ip_hash)

    if enriched_data.present?
      session.apply_firmographic_enrichment!(enriched_data)
      Rails.logger.info("[Enrichment] ✓ Session #{session.id} enriched")
    else
      session.update!(
        stitch_metadata: session.stitch_metadata.merge(
          'enrichment_status' => 'failed',
          'enrichment_attempted_at' => Time.current.iso8601
        )
      )
      Rails.logger.warn("[Enrichment] Failed for session #{session.id}")
    end
  end

  private

  def fetch_firmographic_data_mock(_ip_hash)
    return nil if rand > 0.3

    {
      'company_name' => ['SolarEdge Tech', 'Weg', 'Renner S.A.', 'Ambev', 'Fazenda Bela Vista'].sample,
      'company_domain' => 'example.com',
      'industry' => ['Manufacturing', 'Agriculture', 'Retail', 'Tech'].sample,
      'company_size' => ['11-50', '51-200', '201-500', '500+'].sample,
      'city' => 'São Paulo',
      'state' => 'SP'
    }
  rescue StandardError => e
    Rails.logger.error("[Enrichment] API error: #{e.message}")
    nil
  end
end
