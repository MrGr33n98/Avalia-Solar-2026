# frozen_string_literal: true

module Api
  module V1
    module CompanyAdmin
      class MaterialsController < BaseController
        before_action -> { require_company_feature!('downloadable_materials') }
        before_action :set_material, only: %i[show update destroy submit]

        def index
          authorize CompanyMaterial.new(company: @company), :index?
          render json: { materials: policy_scope(@company.company_materials).order(updated_at: :desc).map { |material| serialize(material) } }
        end

        def show
          authorize @material
          render json: { material: serialize(@material) }
        end

        def create
          material = @company.company_materials.new(material_params)
          authorize material
          return render json: { errors: material.errors.full_messages }, status: :unprocessable_entity unless material.save

          render json: { material: serialize(material) }, status: :created
        end

        def update
          authorize @material
          return render json: { errors: @material.errors.full_messages }, status: :unprocessable_entity unless @material.update(material_params)

          render json: { material: serialize(@material) }
        end

        def destroy
          authorize @material
          @material.update!(status: 'archived')
          head :no_content
        end

        def submit
          authorize @material, :submit?
          return render json: { error: 'Anexe um PDF antes de enviar para aprovação' }, status: :unprocessable_entity unless @material.digital_assets.document.exists?

          @material.update!(status: 'pending', moderation_reason: nil)
          render json: { material: serialize(@material) }
        end

        private

        def set_material
          @material = @company.company_materials.find(params[:id])
        end

        def material_params
          params.require(:material).permit(
            :title, :slug, :description, :material_type, :visibility, :gate_mode,
            :content_lead_form_id, :expires_at
          )
        end

        def serialize(material)
          material.as_json(only: %i[id title slug description material_type visibility gate_mode status published_at expires_at download_count version moderation_reason created_at updated_at]).merge(
            content_lead_form_id: material.content_lead_form_id,
            assets: material.digital_assets.map { |asset| asset.as_json(only: %i[id kind title alt_text caption external_url status processing_status position]) }
          )
        end
      end
    end
  end
end
