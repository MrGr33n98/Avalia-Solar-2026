module Api
  module V1
    module Sales
      class TaxonomiesController < BaseController
        def index
          scope = ::Sales::Taxonomy.active.order(:kind, :name)
          scope = scope.where(kind: params[:kind]) if params[:kind].present?
          render json: { taxonomies: scope.map { |item| { id: item.id, kind: item.kind, name: item.name, slug: item.slug } } }
        end

        def create
          item = ::Sales::Taxonomy.create!(taxonomy_params)
          render json: { taxonomy: { id: item.id, kind: item.kind, name: item.name, slug: item.slug } }, status: :created
        end

        private

        def taxonomy_params
          params.require(:taxonomy).permit(:company_id, :kind, :name, :slug, :active, metadata: {})
        end
      end
    end
  end
end
