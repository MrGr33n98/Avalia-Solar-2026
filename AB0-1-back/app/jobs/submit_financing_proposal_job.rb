class SubmitFinancingProposalJob < ApplicationJob
  queue_as :default

  def perform(lead_id, option_id)
    lead = Lead.find(lead_id)
    lead.update!(wizard_status: 'proposal_processing')
    FinancialGatewayService.submit_proposal(lead, option_id)
    lead.update!(wizard_status: 'proposal_sent')
  rescue ActiveRecord::RecordNotFound
  rescue StandardError => e
    Rails.logger.error("[Financing] proposal job error lead=#{lead_id} #{e.message}")
    begin
      lead = Lead.find_by(id: lead_id)
      lead&.update!(wizard_status: 'proposal_failed')
    rescue StandardError
    end
  end
end
