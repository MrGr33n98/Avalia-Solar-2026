# frozen_string_literal: true

module Api
  module V1
    module Dashboard
      class ServicesController < BaseController
        before_action :set_service, only: %i[update destroy add_images remove_image]

        def index
          services = current_company.company_services
                                    .includes(:category, images_attachments: :blob)
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

          if service.save
            render json: { service: service_payload(service) }, status: :created
          else
            render json: { errors: service.errors.full_messages }, status: :unprocessable_entity
          end
        end

        def update
          service_attrs = service_params
          if service_attrs[:name].present? && @service.slug.blank?
            service_attrs[:slug] = generate_slug(service_attrs[:name])
          end

          if @service.update(service_attrs)
            render json: { service: service_payload(@service) }, status: :ok
          else
            render json: { errors: @service.errors.full_messages }, status: :unprocessable_entity
          end
        end

        def destroy
          @service.destroy
          head :no_content
        end

        def add_images
          uploads = Array(params[:images])
          if uploads.empty? || uploads.size + @service.images.count > 12
            return render json: { errors: ['A galeria permite até 12 imagens.'] }, status: :unprocessable_entity
          end

          allowed = %w[image/jpeg image/png image/webp]
          unless uploads.all? { |file| file.respond_to?(:content_type) && allowed.include?(file.content_type) &&
                                      file.size.positive? && file.size <= 10.megabytes }
            return render json: { errors: ['Envie imagens JPEG, PNG ou WebP de até 10 MB.'] }, status: :unprocessable_entity
          end

          @service.images.attach(uploads)
          render json: { service: service_payload(@service.reload) }, status: :ok
        end

        def remove_image
          attachment = @service.images_attachments.find(params[:attachment_id])
          attachment.purge
          render json: { service: service_payload(@service.reload) }, status: :ok
        end


        private

        def set_service
          @service = current_company.company_services.find(params[:id])
        end

        def service_params
          params.require(:service).permit(
            :name, :slug, :category_id, :description, :price_from, :status,
            coverage: [], images: [], video_links: []
          )
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

        def service_payload(service)
          image_url = if service.images.attached?
                        options = Rails.application.routes.default_url_options.dup
                        options[:port] = 3001 if Rails.env.development? && options[:host] == 'localhost'
                        Rails.application.routes.url_helpers.rails_storage_proxy_url(service.images.first, options)
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
            image_url: image_url,
            image_urls: service.images.map { |image| Rails.application.routes.url_helpers.rails_storage_proxy_url(image, Rails.application.routes.default_url_options) },
            service_images: service.images.map { |image| { id: image.id, url: Rails.application.routes.url_helpers.rails_storage_proxy_url(image, Rails.application.routes.default_url_options) } },
            video_links: service.video_links,
            created_at: service.created_at,
            updated_at: service.updated_at
          }
        end
      end
    end
  end
end
