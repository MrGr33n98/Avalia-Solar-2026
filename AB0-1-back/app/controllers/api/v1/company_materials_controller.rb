# frozen_string_literal: true

module Api
  module V1
    class CompanyMaterialsController < BaseController
      before_action :set_company

      def index
        expires_now
        return render json: { error: 'Company not found' }, status: :not_found if @company.nil?

        unless @company.respond_to?(:feature_enabled?) && @company.feature_enabled?('downloadable_materials')
          return render json: { materials: [], feature_disabled: true }
        end

        materials = @company.company_materials.published.order(published_at: :desc).limit(60)
        Rails.logger.info("[CompanyMaterialsController#index] company_id=#{@company.id} published_count=#{materials.size}")
        render json: { materials: materials.map { |material| serialize(material) } }
      rescue StandardError => e
        log_and_report_error(e)
        render json: { error: 'Erro interno ao carregar materiais' }, status: :internal_server_error
      end

      def show
        expires_now
        return render json: { error: 'Company not found' }, status: :not_found if @company.nil?
        return render json: { error: 'Feature not available' }, status: :not_found unless @company.respond_to?(:feature_enabled?) && @company.feature_enabled?('downloadable_materials')

        material = @company.company_materials.published.find_by!(slug: params[:id])
        render json: { material: serialize(material) }
      rescue ActiveRecord::RecordNotFound
        render json: { error: 'Material not found' }, status: :not_found
      rescue StandardError => e
        log_and_report_error(e)
        render json: { error: 'Erro interno' }, status: :internal_server_error
      end

      private

      def set_company
        raw_id = params[:company_id]
        @company = ::Company.find_by(id: raw_id) || ::Company.find_by(slug: raw_id)
      end

      def serialize(material)
        document = material.digital_assets.published.document.first
        cover = material.digital_assets.published.where(kind: 'image').first

        material.as_json(only: %i[id title slug description material_type gate_mode published_at expires_at download_count]).merge(
          gated: material.gated?,
          file_available: document.present?,
          cover_url: cover&.file_url,
          lead_form: public_form_payload(material.content_lead_form)
        )
      end

      def public_form_payload(form)
        return nil unless form

        form.as_json(only: %i[id name fields consent_text privacy_url version])
      end

      def log_and_report_error(exception)
        Rails.logger.error("[CompanyMaterialsController] company_id=#{@company&.id} error=#{exception.class} message=#{exception.message} backtrace=#{exception.backtrace&.first(10)&.join(' | ')}")
        Sentry.capture_exception(exception) if defined?(Sentry)
      end
    end
  end
end

