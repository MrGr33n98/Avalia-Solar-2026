class LeadScoringWorker
  include Sidekiq::Job
  sidekiq_options queue: 'default'

  def perform(lead_id)
    lead = Lead.find_by(id: lead_id)
    return unless lead

    attribution = lead.attribution_json || {}
    roi = attribution['roi'].to_f
    
    # Logic will be implemented in future stories, for now, basic version
    # system_size_band: "0-5", "5-10", "10-20", "20-50", "50-100", "100+"
    band_score = case lead.system_size_band
                 when '0-5' then 10
                 when '5-10' then 30
                 when '10-20' then 50
                 when '20-50' then 70
                 when '50-100' then 90
                 when '100+' then 100
                 else 0
                 end
    
    # ROI: 0% -> 0, 30%+ -> 100
    roi_score = [roi * 3, 100].min
    
    score = (band_score * 0.4) + (roi_score * 0.6)
    
    # Save the score
    # lead.update_column(:lead_score, score.to_i) # If the column exists
    
    # Also save to attribution_json
    attribution['lead_score'] = score.to_i
    lead.update_column(:attribution_json, attribution)
    
    Rails.logger.info "[LeadScoringWorker] Scored lead #{lead_id} with #{score.to_i}"
  end
end
