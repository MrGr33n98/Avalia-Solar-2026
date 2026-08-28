# frozen_string_literal: true

module Api
  module V1
    class CompanyMaterialsController < BaseController
      before_action :set_company
      rescue_from StandardError, with: :handle_error

      def index
        expires_now
        return render json: { materials: [] } if @company.nil?
        Rails.logger.info("[CompanyMaterialsController#index] company_id=#{@company.id} published_count=#{@company.company_materials.published.count}")
        return render json: { materials: [] } unless @company.respond_to?(:feature_enabled?) && @company.feature_enabled?('downloadable_materials')

        materials = @company.company_materials.published.order(published_at: :desc).limit(60)
        render json: { materials: materials.map { |material| serialize(material) } }
      end

      def show
        expires_now
        return render json: { error: 'Not found' }, status: :not_found if @company.nil?
        return render json: { error: 'Not found' }, status: :not_found unless @company.respond_to?(:feature_enabled?) && @company.feature_enabled?('downloadable_materials')

        material = @company.company_materials.published.find_by!(slug: params[:id])
        render json: { material: serialize(material) }
      end

      private

      def handle_error(exception)
        Rails.logger.error("[CompanyMaterialsController] company_id=#{@company&.id} error=#{exception.class} message=#{exception.message} backtrace=#{exception.backtrace&.first(10)&.join(' | ')}")
        if Rails.env.development? || Rails.env.test?
          render json: { error: exception.class.name, message: exception.message }, status: :internal_server_error
        else
          render json: { materials: [] }
        end
      end

      def set_company
        raw_id = params[:company_id]
        @company = ::Company.find_by(id: raw_id) || ::Company.find_by(slug: raw_id)
      end

      def serialize(material)
        document = begin
          material.digital_assets.published.document.first
        rescue StandardError
          nil
        end

        cover = begin
          material.digital_assets.published.where(kind: 'image').first
        rescue StandardError
          nil
        end

        material.as_json(only: %i[id title slug description material_type gate_mode published_at expires_at download_count]).merge(
          gated: material.gated?,
          file_available: document.present?,
          cover_url: cover&.file_url,
          lead_form: public_form_payload(material.content_lead_form)
        )
      rescue StandardError
        material.as_json(only: %i[id title slug description])
      end

      def public_form_payload(form)
        return nil unless form

        form.as_json(only: %i[id name fields consent_text privacy_url version])
      end
    end
  end
end
