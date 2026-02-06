module Api
  module V1
    module CompanyAdmin
      class FinancingPartnersController < BaseController
        before_action :set_partner, only: %i[update destroy]

        def index
          partners = policy_scope(@company.company_financing_partners).ordered
          render json: { partners: partners.map { |partner| serialize_partner(partner) } }
        end

        def create
          partner = @company.company_financing_partners.new(partner_params.except(:logo))
          authorize partner
          attach_logo(partner)

          if partner.save
            render json: { partner: serialize_partner(partner) }, status: :created
          else
            render json: { errors: partner.errors.full_messages }, status: :unprocessable_entity
          end
        end

        def update
          authorize @partner
          @partner.assign_attributes(partner_params.except(:logo))
          attach_logo(@partner)

          if @partner.save
            render json: { partner: serialize_partner(@partner) }
          else
            render json: { errors: @partner.errors.full_messages }, status: :unprocessable_entity
          end
        end

        def destroy
          authorize @partner
          @partner.destroy
          head :no_content
        end

        def reorder
          partners = policy_scope(@company.company_financing_partners)
          ids = Array(params[:partner_ids] || params[:ids])
          ids.each_with_index do |id, index|
            partner = partners.find_by(id: id)
            partner&.update(position: index)
          end

          render json: { partners: partners.ordered.map { |partner| serialize_partner(partner) } }
        end

        private

        def set_partner
          @partner = @company.company_financing_partners.find(params[:id])
        end

        def partner_params
          params.require(:financing_partner).permit(:name, :partner_type, :website, :priority, :position, :active, :badge, :logo)
        end

        def attach_logo(partner)
          file = params[:logo] || params.dig(:financing_partner, :logo)
          return unless file.present?

          partner.logo.attach(file)
        end

        def serialize_partner(partner)
          partner.as_json(only: %i[id name partner_type website priority position active badge]).merge(
            logo_url: logo_url(partner)
          )
        end

        def logo_url(partner)
          return unless partner.logo.attached?

          Rails.application.routes.url_helpers.rails_storage_proxy_url(
            partner.logo,
            **default_url_options.merge(only_path: false)
          )
        rescue StandardError => e
          Rails.logger.warn("Logo URL generation failed for partner #{partner.id}: #{e.message}")
          nil
        end

        def default_url_options
          Rails.application.routes.default_url_options.presence || { host: 'localhost', port: 3001 }
        end
      end
    end
  end
end
