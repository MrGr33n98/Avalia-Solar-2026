# frozen_string_literal: true
module Api
  module V1
    class CompanyQuoteFormController < BaseController
      before_action :authenticate_api_user
      before_action :set_company
      before_action :authorize_view
      before_action :require_paid!, only: %i[create_draft update_draft publish]
      before_action :authorize_edit!, only: %i[create_draft update_draft publish]
      def show
        published = versions.published.latest_first.first
        draft = versions.draft.latest_first.first
        render json: { company: @company.as_json(only: %i[id name]), entitlement: { can_customize: @company.has_paid_plan?, can_publish: @company.has_paid_plan? }, permissions: { can_view: true, can_edit: policy(@company).update?, can_publish: policy(@company).update? && @company.has_paid_plan? }, published: published&.as_json(only: %i[id version_number published_at]), draft: draft && draft_payload(draft) }
      end
      def create_draft
        draft = LeadWizard::CompanyDraftBuilder.ensure_draft!(company: @company)
        return error('VALIDATION_ERROR', 'Não foi possível criar rascunho.', :unprocessable_entity) unless draft
        render json: { draft: draft_payload(draft), saved_at: draft.updated_at }, status: :created
      rescue ActiveRecord::RecordInvalid => e
        error('VALIDATION_ERROR', e.message, :unprocessable_entity)
      end
      def update_draft
        draft = LeadWizard::CompanyDraftBuilder.ensure_draft!(company: @company)
        return error('VALIDATION_ERROR', 'Rascunho não encontrado.', :not_found) unless draft
        return render(json: { code: 'VERSION_CONFLICT' }, status: :conflict) if params[:expected_updated_at].present? && draft.updated_at.iso8601(6) != params[:expected_updated_at].to_s
        LeadWizard::CompanyDraftUpdater.call(draft, draft_params)
        render json: { draft: draft_payload(draft), saved_at: draft.updated_at }
      rescue ActiveRecord::RecordInvalid, ArgumentError => e
        error('VALIDATION_ERROR', e.message, :unprocessable_entity)
      end
      def publish
        draft = LeadWizard::CompanyDraftBuilder.ensure_draft!(company: @company)
        return error('PUBLISH_FAILED', 'Rascunho não encontrado.', :unprocessable_entity) unless draft
        published = LeadWizard::VersionPublisher.call(draft)
        render json: { published: published.as_json(only: %i[id version_number published_at]) }
      rescue ActiveRecord::RecordInvalid => e
        error('PUBLISH_FAILED', e.message, :unprocessable_entity)
      end
      private
      def set_company
        @company = current_user.admin? ? Company.find_by(id: params[:company_id]) : current_user.active_member_companies.find_by(id: params[:company_id]) || current_user.company
        error('FORBIDDEN', 'Empresa não encontrada.', :not_found) unless @company
      end
      def authorize_view; authorize @company, :view_dashboard?; end
      def authorize_edit!; authorize @company, :update?; end
      def require_paid!; return if current_user.admin? || @company.has_paid_plan?; error('FEATURE_NOT_AVAILABLE', 'Plano atual não permite personalização.', :forbidden); end
      def versions; LeadWizardVersion.where(company_id: @company.id); end
      def clone_published
        published = versions.published.latest_first.first
        published && LeadWizard::VersionCloner.call(published)
      end
      def draft_payload(draft)
        compiled = LeadWizard::VersionCompiler.call(draft)
        { id: draft.id, version_number: draft.version_number, updated_at: draft.updated_at, ui_config: compiled[:ui_config], steps: compiled[:steps], thank_you_config: draft.compiled_thank_you_config }
      end
      def draft_params; params.permit(ui_config: {}, steps: {}, thank_you_config: {}).to_h; end
      def error(code, message, status); render json: { code: code, message: message }, status: status; end
    end
  end
end
