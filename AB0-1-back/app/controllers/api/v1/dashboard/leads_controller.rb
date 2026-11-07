module Api
  module V1
    module Dashboard
      class LeadsController < Api::V1::CompanyDashboardController
        include Paginatable

        before_action :ensure_leads_entitlement!

        def index
          authorize @company, :view_leads?
          leads = filtered_leads.order(created_at: :desc, id: :desc)
          paginated = paginate(leads)
          set_pagination_headers(paginated)

          render json: {
            data: paginated.map { |lead| lead_payload(lead) },
            meta: { pagination: pagination_metadata(paginated) }
          }
        rescue Date::Error, ArgumentError
          render json: { error: 'Intervalo de datas inválido' }, status: :unprocessable_entity
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

        # Restringe os resultados aos contatos já associados à empresa autorizada.
        # Filtros são aplicados ANTES da paginação para manter total e exportação consistentes.
        def filtered_leads
          distributed_ids = @company.lead_distributions.select(:lead_id)
          leads = Lead.where(company_id: @company.id).or(Lead.where(id: distributed_ids))

          if params[:email].present?
            term = ActiveRecord::Base.sanitize_sql_like(params[:email].to_s.strip)
            leads = leads.where('leads.email ILIKE ?', "%#{term}%")
          end

          quote_condition = "(leads.quote_type IS NOT NULL AND leads.quote_type <> '') OR leads.quote_requested_company_id IS NOT NULL"
          case params[:request_type]
          when 'quote'
            leads = leads.where(quote_condition)
          when 'contact'
            leads = leads.where("NOT (#{quote_condition})")
          end

          from_date = Date.iso8601(params[:from_date].to_s) if params[:from_date].present?
          to_date = Date.iso8601(params[:to_date].to_s) if params[:to_date].present?
          raise ArgumentError, 'invalid range' if from_date && to_date && from_date > to_date

          leads = leads.where('leads.created_at >= ?', from_date.beginning_of_day) if from_date
          leads = leads.where('leads.created_at < ?', to_date.next_day.beginning_of_day) if to_date
          leads
        end

        def lead_payload(lead)
          {
            id: lead.id,
            name: lead.name,
            email: lead.email,
            phone: lead.phone,
            message: lead.message,
            project_type: lead.project_type,
            request_type: (lead.quote_type.present? || lead.quote_requested_company_id.present?) ? 'quote' : 'contact',
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
