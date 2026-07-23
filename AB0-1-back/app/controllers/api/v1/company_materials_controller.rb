# frozen_string_literal: true

module Api
  module V1
    class CompanyMaterialsController < BaseController
      before_action :set_company

      def index
        return render json: { materials: [] } unless @company.feature_enabled?('downloadable_materials')

        materials = @company.company_materials.published.order(published_at: :desc).limit(60)
        render json: { materials: materials.map { |material| serialize(material) } }
      end

      def show
        return render json: { error: 'Not found' }, status: :not_found unless @company.feature_enabled?('downloadable_materials')

        material = @company.company_materials.published.find_by!(slug: params[:id])
        render json: { material: serialize(material) }
      end

      private

      def set_company
        @company = Company.find(params[:company_id])
      end

      def serialize(material)
        document = material.digital_assets.published.document.first
        material.as_json(only: %i[id title slug description material_type gate_mode published_at expires_at download_count]).merge(
          gated: material.gated?,
          file_available: document.present?
        )
      end
    end
  end
end
