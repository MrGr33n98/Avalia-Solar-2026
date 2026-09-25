# frozen_string_literal: true

module Api
  module V1
    module Sales
      class TrackingSitesController < BaseController
        before_action -> { require_sales_permission!('settings', 'manage') }

        def index
          render json: { tracking_site: serialized_site(current_site) }
        end

        def create
          tenant_id = current_user.company_id
          if tenant_id.blank?
            return render_error_response(message: 'Usuário sem tenant.', status: :unprocessable_entity,
                                         code: 'TENANT_REQUIRED')
          end

          site = current_site || ::Sales::TrackingSite.new(company_id: tenant_id)
          creating = site.new_record?

          site.assign_attributes(site_params)
          site.save!
          render json: { tracking_site: serialized_site(site) }, status: creating ? :created : :ok
        end

        def update
          site = current_site || raise(ActiveRecord::RecordNotFound)
          site.update!(site_params)
          render json: { tracking_site: serialized_site(site) }
        end

        def rotate_key
          site = current_site || raise(ActiveRecord::RecordNotFound)
          site.update!(public_key: SecureRandom.urlsafe_base64(32))
          render json: { tracking_site: serialized_site(site) }
        end

        private

        def current_site
          return if current_user.company_id.blank?

          ::Sales::TrackingSite.find_by(company_id: current_user.company_id)
        end

        def site_params
          params.require(:tracking_site).permit(allowed_origins: [])
        end

        def serialized_site(site)
          return { configured: false } unless site

          {
            configured: true,
            id: site.id,
            public_key: site.public_key,
            allowed_origins: site.allowed_origins,
            active: site.active,
            snippet_url: "#{request.base_url}/api/v1/public/sales/tracking/#{site.public_key}.js"
          }
        end
      end
    end
  end
end
