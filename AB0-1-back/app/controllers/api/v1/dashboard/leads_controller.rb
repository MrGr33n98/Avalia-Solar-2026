module Api
  module V1
    module Dashboard
      class LeadsController < Api::V1::CompanyDashboardController
        include Paginatable

        before_action :ensure_leads_entitlement!

        def index
          authorize @company, :view_leads?
          distributed_ids = @company.lead_distributions.select(:lead_id)
          leads = Lead.where(company_id: @company.id).or(Lead.where(id: distributed_ids)).order(created_at: :desc)
          paginated = paginate(leads)
          set_pagination_headers(paginated)

          render json: {
            data: paginated.map { |lead| lead_payload(lead) },
            meta: { pagination: pagination_metadata(paginated) }
          }
        end

        private

        def set_company
          return super if params[:company_id].blank?

          @company = policy_scope(::Company).find_by(id: params[:company_id])
          render json: { error: 'Company not found' }, status: :not_found unless @company
        end

        def ensure_leads_entitlement!
          enforce_feature_access!(:leads_marketplace, company: @company)
        end

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
            city: lead.city,
            state: lead.state,
            product_vertical: lead.product_vertical,
            source: lead.source,
            score: lead.cached_score,
            score_band: lead.score_band,
            distributions: distribution_payload(lead),
            created_at: lead.created_at
          }
        end

        def distribution_payload(lead)
          lead.lead_distributions.where(company_id: @company.id).map do |distribution|
            {
              id: distribution.id,
              status: distribution.status,
              sent_at: distribution.sent_at,
              viewed_at: distribution.viewed_at,
              accepted_at: distribution.accepted_at
            }
          end
        end
      end
    end
  end
end
