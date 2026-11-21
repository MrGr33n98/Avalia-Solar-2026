# frozen_string_literal: true

module Api
  module V1
    module CompanyAi
      class CapabilitiesController < Api::V1::BaseController
        def show
          company = ::Company.find_by_slug_or_id(params[:id])
          company = nil unless company&.status == 'active'
          gate = ::CompanyAi::FeatureGate.call(company: company)
          assistant = ::CompanyAiAssistant.find_by(company_id: company.id) if gate.allowed?
          active = gate.allowed? && assistant&.enabled == true && assistant.published_workflow.present?
          response.headers['Cache-Control'] = 'private, no-store'
          render json: { enabled: !!active, mode: active ? 'company' : 'general', schema_version: 1,
                         company_id: (active ? company.id : nil), company_name: (active ? company.name : nil) }.compact
        end
      end
    end
  end
end
