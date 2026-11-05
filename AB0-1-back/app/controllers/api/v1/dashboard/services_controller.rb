# frozen_string_literal: true

module Api
  module V1
    module Dashboard
      class ServicesController < BaseController
        MAX_GALLERY_IMAGES = 8
        MAX_IMAGE_SIZE = 8.megabytes
        ALLOWED_IMAGE_TYPES = %w[image/jpeg image/png image/webp].freeze

        before_action :set_service, only: %i[update destroy]

        def index
          services = current_company.company_services
                                    .includes(:category, :cover_image_attachment, images_attachments: :blob)
                                    .order(updated_at: :desc)

          paginated = paginate(services)
          set_pagination_headers(paginated)

          render json: {
            data: paginated.map { |service| service_payload(service) },
            meta: {
              pagination: pagination_metadata(paginated),
              stats: {
                total: services.count,
                active: services.where(status: 'active').count,
                inactive: services.where(status: 'inactive').count
              }
            }
          }
        end

        def create
          service = current_company.company_services.new(service_params)
          service.status = 'active' if service.status.blank?
          service.slug = generate_slug(service.name) if service.slug.blank?

          media = service_media
          error = media_error(service, media)
          return render_media_error(error) if error

          CompanyService.transaction do
            service.save!
            attach_media!(service, media)
          end

          render json: { service: service_payload(service.reload) }, status: :created
        rescue ActiveRecord::RecordInvalid => e
          render json: { errors: e.record.errors.full_messages }, status: :unprocessable_entity
        end

        def update
          attrs = service_params
          if attrs[:name].present? && @service.slug.blank?
            attrs[:slug] = generate_slug(attrs[:name])
          end

          media = service_media
          error = media_error(@service, media)
          return render_media_error(error) if error

          CompanyService.transaction do
            @service.update!(attrs)
            attach_media!(@service, media)
          end

          render json: { service: service_payload(@service.reload) }, status: :ok
        rescue ActiveRecord::RecordInvalid => e
          render json: { errors: e.record.errors.full_messages }, status: :unprocessable_entity
        end

        def destroy
          @service.destroy
          head :no_content
        end

        private

        def set_service
          @service = current_company.company_services.find(params[:id])
        end

        # Dados escalares são separados dos arquivos para evitar que um PATCH
        # sobrescreva acidentalmente a galeria existente do Active Storage.
        def service_params
          params.require(:service).permit(
            :name, :slug, :category_id, :description, :price_from, :status,
            coverage: []
          )
        end

        def service_media
          submitted = params.require(:service)
          {
            cover: submitted[:cover_image].presence,
            images: Array(submitted[:images]).reject(&:blank?),
            remove_ids: Array(submitted[:remove_image_ids]).filter_map { |id| Integer(id, exception: false) }.uniq,
            remove_cover: ActiveModel::Type::Boolean.new.cast(submitted[:remove_cover_image])
          }
        end

        def media_error(service, media)
          existing_ids = service.images_attachments.map(&:id)
          return 'Imagem não pertence a este serviço.' unless (media[:remove_ids] - existing_ids).empty?

          final_count = existing_ids.size - media[:remove_ids].size + media[:images].size
          return "O limite é de #{MAX_GALLERY_IMAGES} imagens na galeria." if final_count > MAX_GALLERY_IMAGES

          files = media[:images] + [media[:cover]].compact
          files.each do |file|
            unless file.respond_to?(:tempfile) && file.respond_to?(:content_type) && file.respond_to?(:size)
              return 'Arquivo de imagem inválido.'
            end

            detected_type = Marcel::MimeType.for(file.tempfile, name: file.original_filename)
            unless ALLOWED_IMAGE_TYPES.include?(file.content_type) && ALLOWED_IMAGE_TYPES.include?(detected_type)
              return 'Formato inválido. Envie JPEG, PNG ou WebP.'
            end
            return 'Cada imagem deve ter até 8 MB.' if file.size > MAX_IMAGE_SIZE
          end

          nil
        end

        def render_media_error(message)
          render json: { code: 'INVALID_SERVICE_MEDIA', errors: [message] }, status: :unprocessable_entity
        end

        def attach_media!(service, media)
          media[:remove_ids].each { |id| service.images_attachments.find(id).purge }
          service.cover_image.purge if media[:remove_cover] && service.cover_image.attached?
          service.cover_image.attach(media[:cover]) if media[:cover]
          service.images.attach(media[:images]) if media[:images].any?
        end

        def generate_slug(name)
          base_slug = name.to_s.parameterize.presence || 'servico'
          candidate = base_slug
          counter = 1

          while current_company.company_services.exists?(slug: candidate)
            candidate = "#{base_slug}-#{counter}"
            counter += 1
          end

          candidate
        end

        def image_url(attachment)
          options = Rails.application.routes.default_url_options.dup
          options[:port] = 3001 if Rails.env.development? && options[:host] == 'localhost'
          Rails.application.routes.url_helpers.rails_storage_proxy_url(attachment, options)
        end

        def service_payload(service)
          cover_url = image_url(service.cover_image) if service.cover_image.attached?
          gallery = service.images_attachments.map do |attachment|
            { id: attachment.id, url: image_url(attachment) }
          end

          {
            id: service.id,
            company_id: service.company_id,
            name: service.name,
            slug: service.slug,
            category_id: service.category_id,
            category: service.category && {
              id: service.category.id,
              name: service.category.name,
              slug: service.category.seo_url
            },
            description: service.description,
            price_from: service.price_from&.to_f,
            coverage: service.coverage,
            status: service.status,
            image_url: cover_url || gallery.first&.dig(:url),
            cover_image_url: cover_url,
            images: gallery,
            public_url: "/companies/#{service.company.slug.presence || service.company.id}/services/#{service.slug}",
            created_at: service.created_at,
            updated_at: service.updated_at
          }
        end
      end
    end
  end
end
