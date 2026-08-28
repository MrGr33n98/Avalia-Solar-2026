# frozen_string_literal: true

module Api
  module V1
    module CompanyAdmin
      class MaterialsController < BaseController
        before_action -> { require_company_feature!('downloadable_materials') }
        before_action :set_material, only: %i[show update destroy submit publish restore]

        def index
          authorize CompanyMaterial.new(company: @company), :index?
          render json: { materials: policy_scope(@company.company_materials).order(updated_at: :desc).map { |material| serialize(material) }, auto_publish: auto_publish_materials? }
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
          was_published = @material.status == 'published'
          return render json: { errors: @material.errors.full_messages }, status: :unprocessable_entity unless @material.update(material_params)

          @material.update!(status: 'pending', published_at: nil, moderation_reason: nil) if was_published

          render json: { material: serialize(@material) }
        end

        def destroy
          authorize @material
          @material.update!(status: 'archived')
          head :no_content
        end

        def restore
          authorize @material, :restore?
          return render json: { error: "Somente materiais arquivados podem ser restaurados" }, status: :unprocessable_entity unless @material.status == "archived"

          @material.update!(status: "draft", published_at: nil, moderation_reason: nil)
          render json: { material: serialize(@material) }
        end

        def submit
          authorize @material, :submit?
          documents = @material.digital_assets.document.where.not(status: 'archived')
          return render json: { error: 'Anexe um PDF antes de enviar para aprovação' }, status: :unprocessable_entity unless documents.exists?
          unless documents.where(processing_status: 'ready').exists?
            return render json: { error: 'O PDF ainda está sendo processado. Aguarde a conclusão antes de enviar para revisão.' }, status: :unprocessable_entity
          end

          return publish_material if auto_publish_materials? && publishable_assets_ready?

          @material.update!(status: 'pending', published_at: nil, moderation_reason: nil)
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

        public
        def publish
          authorize @material, :submit?
          return render json: { error: 'Publicação automática não habilitada para esta empresa' }, status: :forbidden unless auto_publish_materials?
          return render json: { error: 'Anexe um PDF antes de publicar' }, status: :unprocessable_entity unless publishable_assets?

          publish_material
        end


        def auto_publish_materials?
          @company.respond_to?(:feature_enabled_from_plan?) && @company.feature_enabled_from_plan?('auto_publish_materials', include_defaults: false)
        end

        def publishable_assets?
          @material.digital_assets.document.where.not(status: 'archived').exists?
        end

        def publishable_assets_ready?
          assets = @material.digital_assets.document.where.not(status: 'archived')
          assets.exists? && assets.all? { |a| a.processing_status == 'ready' }
        end

        def publish_material
          CompanyMaterial.transaction do
            @material.update!(status: 'published', published_at: Time.current, moderation_reason: nil)
            @material.digital_assets.where.not(status: 'archived').update_all(status: 'published')
          end
          render json: { material: serialize(@material.reload) }
        end


        def serialize(material)
          material.as_json(only: %i[id title slug description material_type visibility gate_mode status published_at expires_at download_count version moderation_reason created_at updated_at]).merge(
            content_lead_form_id: material.content_lead_form_id,
            assets: material.digital_assets.map { |asset| asset.as_json(only: %i[id kind title alt_text caption external_url status processing_status position]).merge(file_url: asset.file_url, file_size: asset.file.attached? ? asset.file.blob.byte_size : nil, file_name: asset.file.attached? ? asset.file.filename.to_s : nil) }
          )
        end
      end
    end
  end
end
