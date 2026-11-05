module Api
  module V1
    class BadgesController < BaseController
      skip_before_action :authenticate_api_user, only: [:show], raise: false

      # GET /api/v1/companies/:id/badges
      def index
        company_id = params[:company_id] || params[:id]
        company = ::Company.find_by_slug_or_id!(company_id)
        badges = company.badges.active.order(position: :asc)

        render json: badges.map { |badge| badge_payload(badge) }
      end

      # GET /api/v1/badges/:slug
      def show
        badge = ::Badge.active.find_by!(public_slug: params[:slug])

        # Opcionalmente incluir empresas que possuem o selo
        companies = badge.companies.active.limit(5).map do |c|
          { id: c.id, name: c.name, slug: c.slug, logo_url: c.logo_url }
        end

        # A verificação de conquista é específica para uma empresa.
        # A existência de um badge no catálogo NÃO equivale à sua concessão.
        company_id = params[:company_id].to_s
        requested = company_id.present?
        company = if requested && company_id.match?(/\\A[0-9]+\\z/)
                    ::Company.active.find_by(id: company_id)
                  end
        award_valid = company.present? && ::CompanyBadge.exists?(company_id: company.id, badge_id: badge.id)

        render json: {
          badge: badge_payload(badge),
          featured_companies: companies,
          award_valid: requested ? award_valid : nil,
          awarded_company: award_valid ? { id: company.id, name: company.name, slug: company.slug } : nil
        }
      end

      private

      def badge_payload(badge)
        {
          id: badge.id,
          name: badge.name,
          description: badge.description,
          category: badge.category_label,
          year: badge.year,
          edition: badge.edition,
          public_slug: badge.public_slug,
          image_url: badge.image_url,
          verifiable_url: "#{ENV.fetch('FRONTEND_URL', 'https://avaliasolar.com.br')}/badges/#{badge.public_slug}"
        }
      end
    end
  end
end
