# frozen_string_literal: true

module Api
  module V1
    module Sales
      class EmailAssetsController < BaseController
        def index
          scope = scoped_assets
                  .by_kind(params[:kind])
                  .search_by_name(params[:q])

          status_filter = params[:status].presence || 'ready'
          scope = scope.where(status: status_filter) unless status_filter == 'all'
          scope = scope.order(created_at: :desc)

          page = [params[:page].to_i, 1].max
          per_page = [[params[:per_page].to_i, 1].max, 100].min
          per_page = 24 if params[:per_page].blank?

          paginated = scope.page(page).per(per_page)

          render json: {
            assets: paginated.map { |asset| serialize(asset) },
            meta: {
              page: paginated.current_page,
              per_page: paginated.limit_value,
              total: paginated.total_count,
              total_pages: paginated.total_pages
            }
          }
        end

        def show
          asset = scoped_assets.find(params[:id])
          render json: { asset: serialize(asset) }
        end

        def create
          file = params[:file] || params.dig(:asset, :file)
          if file.blank?
            return render json: {
              error: { code: 'MISSING_FILE', message: 'Arquivo de imagem é obrigatório.' }
            }, status: :unprocessable_entity
          end

          asset = ::Sales::EmailAssets::UploadService.call(
            file: file,
            company: current_user.company,
            user: current_user,
            kind: params[:kind] || params.dig(:asset, :kind),
            alt_text: params[:alt_text] || params.dig(:asset, :alt_text),
            name: params[:name] || params.dig(:asset, :name)
          )

          render json: { asset: serialize(asset) }, status: :created
        rescue ::Sales::EmailAssets::UploadService::InvalidFileTypeError => e
          render json: { error: { code: 'INVALID_FILE_TYPE', message: e.message } }, status: :unprocessable_entity
        rescue ::Sales::EmailAssets::UploadService::FileTooLargeError => e
          render json: { error: { code: 'FILE_TOO_LARGE', message: e.message } }, status: :payload_too_large
        rescue StandardError => e
          render json: { error: { code: 'UPLOAD_FAILED', message: e.message } }, status: :unprocessable_entity
        end

        def update
          asset = scoped_assets.find(params[:id])
          update_params = params.require(:asset).permit(:name, :alt_text, :kind)
          asset.update!(update_params)
          render json: { asset: serialize(asset) }
        rescue ActiveRecord::RecordInvalid => e
          render json: { error: { code: 'VALIDATION_ERROR', message: e.record.errors.full_messages.to_sentence } }, status: :unprocessable_entity
        end

        def destroy
          asset = scoped_assets.find(params[:id])
          if asset.in_use_by_campaigns?
            return render json: {
              error: {
                code: 'ASSET_IN_USE',
                message: 'Asset em uso por campanhas enviadas ou agendadas. Não pode ser excluído para preservar o histórico.'
              }
            }, status: :conflict
          end

          asset.archive!
          render json: { message: 'Imagem arquivada com sucesso.' }
        end

        private

        def scoped_assets
          ::Sales::EmailAsset.where(company_id: current_user.company_id).active
        end

        def serialize(asset)
          {
            id: asset.id,
            name: asset.name,
            kind: asset.kind,
            status: asset.status,
            alt_text: asset.alt_text,
            width_px: asset.width_px,
            height_px: asset.height_px,
            mime_type: asset.mime_type,
            byte_size: asset.byte_size,
            public_url: asset.resolve_public_url,
            in_use_by_campaigns: asset.in_use_by_campaigns?,
            in_use_by_templates: asset.in_use_by_templates?,
            created_at: asset.created_at&.iso8601
          }
        end
      end
    end
  end
end
