# frozen_string_literal: true

module Api
  module V1
    module CompanyAi
      class SessionsController < Api::V1::BaseController
        # Public, but only after a server-resolved tenant is explicitly entitled and published.
        def create
          company = ::Company.find_by_slug_or_id(params[:id])
          company = nil unless company&.status == 'active'
          gate = ::CompanyAi::FeatureGate.call(company: company)
          return render(json: { code: gate.reason }, status: :forbidden) unless gate.allowed?

          if !::CompanyAi::SessionRateLimiter.allowed?(ip: request.remote_ip, company_id: company.id)
            return render json: { code: 'COMPANY_AI_RATE_LIMITED' }, status: :too_many_requests,
                          headers: { 'Retry-After' => '60' }
          end

          session, greeting = ::CompanyAi::SessionStarter.call(company: company, user: current_user)
          response.headers['Cache-Control'] = 'private, no-store'
          render json: {
            session_id: session.id,
            access_token: ::Chat::SessionAccessToken.generate(session),
            company_id: company.id,
            workflow_version_id: session.metadata.fetch('company_ai_workflow_version_id'),
            initial_message: { id: greeting.id, role: greeting.role, content: greeting.content }
          }, status: :created
        rescue ::CompanyAi::SessionStarter::Unavailable => e
          render json: { code: e.message }, status: :forbidden
        end
      end
    end
  end
end
