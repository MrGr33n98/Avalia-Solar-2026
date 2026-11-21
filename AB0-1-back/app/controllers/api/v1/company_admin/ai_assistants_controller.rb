# frozen_string_literal: true

module Api
  module V1
    module CompanyAdmin
      class AiAssistantsController < BaseController
        before_action :authorize_editor!
        before_action :authorize_feature!

        def show
          assistant = ::CompanyAiAssistant.find_or_initialize_by(company: @company)
          render json: serialize(assistant)
        end

        def update
          assistant = ::CompanyAiAssistant.find_or_initialize_by(company: @company)
          attrs = params.require(:assistant).permit(:greeting, :timezone, :enabled, weekly_hours: {}, exceptions: {})
          # Publication and runtime activation are server-controlled.
          attrs.delete(:enabled)
          if assistant.update(attrs)
            audit!(assistant, 'assistant_config_updated')
            render json: serialize(assistant)
          else
            render json: { errors: assistant.errors.full_messages }, status: :unprocessable_entity
          end
        end

        def create_draft
          assistant = ::CompanyAiAssistant.find_or_create_by!(company: @company)
          definition = params.require(:definition).permit!.to_h
          version = assistant.with_lock do
            number = assistant.workflow_versions.maximum(:version_number).to_i + 1
            assistant.workflow_versions.create!(version_number: number, status: 'draft', definition: definition,
                                                created_by_id: current_user.id)
          end
          audit!(assistant, 'workflow_draft_created', workflow_version_id: version.id)
          render json: { id: version.id, status: version.status, version_number: version.version_number,
                         validation_errors: ::CompanyAi::WorkflowValidator.call(definition).errors }, status: :created
        end

        def publish
          assistant = ::CompanyAiAssistant.find_by!(company: @company)
          version = assistant.workflow_versions.find(params[:version_id])
          published = ::CompanyAi::Publisher.call(assistant: assistant, version: version, actor: current_user)
          render json: { id: published.id, status: published.status, version_number: published.version_number }
        rescue ArgumentError => e
          render json: { code: 'PUBLISH_REJECTED', message: e.message }, status: :unprocessable_entity
        end

        private

        def authorize_editor!
          # Never trust an arbitrary company_id; membership must be active for the *resolved* tenant.
          return if current_user&.admin?
          return if current_user&.respond_to?(:active_membership_for?) && current_user.active_membership_for?(@company.id)

          render json: { code: 'FORBIDDEN' }, status: :forbidden
        end

        def authorize_feature!
          decision = ::CompanyAi::FeatureGate.call(company: @company)
          return if decision.allowed?

          render json: { code: decision.reason }, status: :forbidden
        end

        def audit!(assistant, action, workflow_version_id: nil)
          ::CompanyAiAuditEvent.create!(company: @company, company_ai_assistant: assistant,
                                        actor_user_id: current_user.id, action: action,
                                        workflow_version_id: workflow_version_id)
        end

        def serialize(assistant)
          version = assistant.persisted? ? assistant.published_workflow : nil
          { id: assistant.id, company_id: @company.id, enabled: assistant.enabled == true,
            greeting: assistant.greeting, timezone: assistant.timezone,
            weekly_hours: assistant.weekly_hours || {}, exceptions: assistant.exceptions || {},
            workflow_version: version&.version_number }
        end
      end
    end
  end
end
