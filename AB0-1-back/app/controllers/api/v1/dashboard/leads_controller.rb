module Api
  module V1
    module Dashboard
      class LeadsController < BaseController
      def index
        leads = current_company.leads.order(created_at: :desc)
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
          created_at: lead.created_at
        }
      end
      end
    end
  end
end
