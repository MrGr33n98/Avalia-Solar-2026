module Api
  module V1
    module Dashboard
      class LeadsController < BaseController
        def index
          leads = Lead.joins(:lead_distributions).where(lead_distributions: { company_id: current_company.id }).distinct.order(created_at: :desc)
          paginated = paginate(leads)
          set_pagination_headers(paginated)

          render json: {
            data: paginated.map { |lead| lead_payload(lead) },
            meta: { pagination: pagination_metadata(paginated) }
          }
        end

        private

        def lead_payload(lead)
          {
            id: lead.id,
            name: lead.name,
            email: lead.email,
            phone: lead.phone,
            message: lead.message,
            project_type: lead.project_type,
            estimated_budget: lead.estimated_budget,
            location: lead.location,
            source: lead.source,
            score: lead.cached_score,
            score_band: lead.score_band,
            distributions: lead.lead_distributions.where(company_id: current_company.id).map do |distribution|
              { id: distribution.id, status: distribution.status, sent_at: distribution.sent_at, viewed_at: distribution.viewed_at, accepted_at: distribution.accepted_at }
            end,
            created_at: lead.created_at
          }
        end
      end
    end
  end
end
