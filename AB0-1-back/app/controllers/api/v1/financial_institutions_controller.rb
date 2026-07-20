module Api
  module V1
    class FinancialInstitutionsController < Api::V1::BaseController
      def index
        @institutions = FinancialInstitution.active_only.ordered.includes(:financing_options, :banners)
        
        # Apply basic caching if no filters are dynamic enough to bust it constantly
        # In a real app, you might want to cache the rendered JSON or use stale?
        
        render json: @institutions, each_serializer: FinancialInstitutionSerializer
      end

      def show
        @institution = FinancialInstitution.active_only.friendly.find(params[:id])
        render json: @institution, serializer: FinancialInstitutionSerializer
      end
    end
  end
end
