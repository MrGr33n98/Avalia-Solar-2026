module Api
  module V1
    module CompanyAdmin
      class FinancingProfilesController < BaseController
        before_action :ensure_profile

        def show
          authorize @profile
          render json: response_payload
        end

        def update
          authorize @profile
          @company.update(financing_enabled: params[:financing_enabled]) if params.key?(:financing_enabled)

          if @profile.update(profile_params)
            render json: response_payload
          else
            render json: { errors: @profile.errors.full_messages }, status: :unprocessable_entity
          end
        end

        private

        def ensure_profile
          @profile = @company.company_financing_profile || @company.build_company_financing_profile
        end

        def profile_params
          params.require(:financing_profile).permit(
            :title, :subtitle, :disclaimer, :cta_label, :cta_url, :currency,
            :default_amount_cents, :min_amount_cents, :max_amount_cents,
            :default_down_payment_percent, :min_down_payment_percent, :max_down_payment_percent,
            :default_term_months, :min_term_months, :max_term_months,
            :default_interest_rate_monthly, :min_interest_rate_monthly, :max_interest_rate_monthly,
            :grace_months_enabled, :max_grace_months, :amortization_type,
            :show_bank_logos, :show_fee_inputs, :status
          )
        end

        def response_payload
          {
            financing_enabled: @company.financing_enabled,
            profile: serialize_profile(@profile)
          }
        end

        def serialize_profile(profile)
          return nil unless profile

          profile.as_json(
            only: %i[
              id title subtitle disclaimer cta_label cta_url currency status
              default_amount_cents min_amount_cents max_amount_cents
              default_down_payment_percent min_down_payment_percent max_down_payment_percent
              default_term_months min_term_months max_term_months
              default_interest_rate_monthly min_interest_rate_monthly max_interest_rate_monthly
              grace_months_enabled max_grace_months amortization_type show_bank_logos show_fee_inputs
            ]
          )
        end
      end
    end
  end
end
