module Api
  module V1
    module Sales
      class IntegrationsController < BaseController
        def index
          integrations = ::Sales::Integration.order(created_at: :desc)
          integrations = integrations.where(company_id: current_user.company_id) unless current_user.admin?
          render json: { integrations: integrations.map { |item| serialize(item) } }
        end

        def create
          integration = ::Sales::Integration.create!(integration_params.merge(created_by: current_user, company_id: current_user.admin? ? integration_params[:company_id] : current_user.company_id))
          render json: { integration: serialize(integration) }, status: :created
        end

        private

        def integration_params
          params.require(:integration).permit(:company_id, :provider, :name, :status, settings: {})
        end

        def serialize(item)
          { id: item.id, provider: item.provider, name: item.name, status: item.status,
            last_synced_at: item.last_synced_at, settings: item.settings }
        end
      end
    end
  end
end
