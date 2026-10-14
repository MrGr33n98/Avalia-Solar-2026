# frozen_string_literal: true

module Api
  module V1
    module CompanyDashboard
      class ProposalSettingsController < CompanyDashboardController
        def show
          authorize @company, :update?
          settings = @company.proposal_setting_or_default
          render json: { proposal_settings: settings.as_payload }
        end

        def update
          authorize @company, :update?
          settings = @company.proposal_setting || @company.build_proposal_setting

          if params[:proposal_settings].present?
            apply_settings_params(settings, params.require(:proposal_settings))
          end

          if settings.save
            render json: { proposal_settings: settings.as_payload, message: 'Configurações de proposta salvas com sucesso' }
          else
            render json: { errors: settings.errors.full_messages }, status: :unprocessable_entity
          end
        rescue ActionController::ParameterMissing => e
          render json: { error: e.message }, status: :bad_request
        end

        private

        def apply_settings_params(settings, payload)
          settings.default_model = payload[:selected_model] if payload.key?(:selected_model)
          settings.cover_mode = payload[:cover_mode] if payload.key?(:cover_mode)
          settings.cover_image_url = payload[:cover_image_url] if payload.key?(:cover_image_url)

          if payload[:pdf_colors].is_a?(ActionController::Parameters) || payload[:pdf_colors].is_a?(Hash)
            settings.pdf_colors = payload[:pdf_colors].to_unsafe_h
          end

          if payload.key?(:pdf_sections)
            settings.sections_config = sanitize_json_array(payload[:pdf_sections])
          end

          if payload.key?(:pricing_tiers)
            settings.pricing_tiers = sanitize_json_array(payload[:pricing_tiers])
          end

          if payload.key?(:payment_conditions)
            settings.payment_conditions = sanitize_json_array(payload[:payment_conditions])
          end

          if payload.key?(:digital_sections)
            settings.digital_sections = sanitize_json_array(payload[:digital_sections])
          end

          if payload.key?(:custom_form_fields)
            settings.custom_form_fields = sanitize_json_array(payload[:custom_form_fields])
          end
        end

        def sanitize_json_array(val)
          case val
          when ActionController::Parameters
            val.values.map { |item| item.respond_to?(:to_unsafe_h) ? item.to_unsafe_h : item }
          when Array
            val.map { |item| item.respond_to?(:to_unsafe_h) ? item.to_unsafe_h : item }
          else
            []
          end
        end
      end
    end
  end
end
