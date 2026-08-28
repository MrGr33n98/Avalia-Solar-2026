# frozen_string_literal: true

module Api
  module V1
    module CompanyAdmin
      class AssetsController < BaseController
        def create
          attachable = find_attachable!
          require_company_feature!(attachable.is_a?(CompanyProject) ? 'projects_showcase' : 'downloadable_materials')
          return if performed?
          authorize attachable, :update?
          asset = attachable.digital_assets.new(asset_params.except(:file))
          asset.company = @company
          if asset_params[:file].present?
            asset.file.attach(asset_params[:file])
            asset.processing_status = 'ready'
          end
          return render json: { errors: asset.errors.full_messages }, status: :unprocessable_entity unless asset.save

          render json: { asset: serialize(asset) }, status: :created
        end

        def destroy
          asset = @company.digital_assets.find(params[:id])
          authorize asset.attachable, :update?
          asset.update!(status: 'archived')
          head :no_content
        end

        def update
          asset = @company.digital_assets.find(params[:id])
          require_company_feature!(asset.attachable.is_a?(CompanyProject) ? 'projects_showcase' : 'downloadable_materials')
          return if performed?
          authorize asset.attachable, :update?
          was_published = asset.status == 'published'
          return render json: { errors: asset.errors.full_messages }, status: :unprocessable_entity unless asset.update(asset_update_params)

          asset.update!(status: 'pending') if was_published
          # Se o material pai estava publicado e o asset foi despublicado, despublicar o material
          if was_published && asset.attachable.is_a?(CompanyMaterial) && asset.attachable.status == 'published'
            asset.attachable.unpublish!(target_status: 'pending')
          end
          render json: { asset: serialize(asset) }
        end

        private

        def find_attachable!
          case params[:attachable_type]
          when 'project' then @company.company_projects.find(params[:attachable_id])
          when 'material' then @company.company_materials.find(params[:attachable_id])
          else
            raise ActionController::BadRequest, 'attachable_type inválido'
          end
        end

        def asset_params
          params.permit(:kind, :title, :alt_text, :caption, :external_url, :provider, :position, :file, metadata: {})
        end

        def asset_update_params
          params.permit(:title, :alt_text, :caption, :external_url, :provider, :position, metadata: {})
        end

        def serialize(asset)
          asset.as_json(only: %i[id kind title alt_text caption external_url provider status processing_status position metadata created_at])
        end
      end
    end
  end
end
