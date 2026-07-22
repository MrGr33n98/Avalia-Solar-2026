# frozen_string_literal: true

module Api
  module V1
    module Dashboard
      class IcpProfilesController < BaseController
        before_action :authenticate_api_user
        before_action :set_company
        before_action :set_profile

        def show
          render json: serialize_profile(@profile)
        end

        def update
          if @profile.update(icp_profile_params)
            render json: serialize_profile(@profile)
          else
            render_error_response(
              message: 'Falha ao salvar configurações de ICP.',
              status: :unprocessable_entity,
              code: 'INVALID_ICP_PROFILE',
              errors: @profile.errors.full_messages
            )
          end
        end

        private

        def set_company
          company_id = params[:company_id].presence || cookies.signed[:active_company_id]
          @company = Company.find(company_id)
          return if current_user.admin? || current_user.active_membership_for?(@company.id)

          render_error_response(
            message: 'Você não possui acesso a esta empresa.',
            status: :forbidden,
            code: 'COMPANY_ACCESS_REQUIRED'
          )
        end

        def set_profile
          @profile = @company.company_icp_profile || @company.create_company_icp_profile!
        end

        def icp_profile_params
          params.permit(
            :min_monthly_bill, :max_monthly_bill, :min_system_kwp,
            :min_ev_chargers_count, :strictness_level,
            :auto_reject_out_of_icp, :notify_only_high_match,
            :nationwide,
            target_audiences: [],
            preferred_roof_types: [],
            ev_charger_types: [],
            target_cities: [],
            target_states: []
          )
        end

        def serialize_profile(profile)
          {
            id: profile.id,
            company_id: profile.company_id,
            min_monthly_bill: profile.min_monthly_bill,
            max_monthly_bill: profile.max_monthly_bill,
            min_system_kwp: profile.min_system_kwp,
            min_ev_chargers_count: profile.min_ev_chargers_count,
            strictness_level: profile.strictness_level,
            auto_reject_out_of_icp: profile.auto_reject_out_of_icp,
            notify_only_high_match: profile.notify_only_high_match,
            nationwide: profile.nationwide,
            target_audiences: Array(profile.target_audiences),
            preferred_roof_types: Array(profile.preferred_roof_types),
            ev_charger_types: Array(profile.ev_charger_types),
            target_cities: Array(profile.target_cities),
            target_states: Array(profile.target_states),
            updated_at: profile.updated_at
          }
        end
      end
    end
  end
end
