module Api
  module V1
    module Sales
      class FormsController < BaseController
        skip_before_action :authenticate_api_user, only: %i[show submit]
        skip_before_action :require_internal_sales, only: %i[show submit]

        def show
          form = ::Sales::Form.find_by!(slug: params[:id], active: true)
          render json: { form: { id: form.id, name: form.name, slug: form.slug, fields: form.fields } }
        end

        def submit
          form = ::Sales::Form.find_by!(slug: params[:id], active: true)
          submission = ::Sales::FormSubmission.create!(form: form, idempotency_key: request.headers['Idempotency-Key'].presence || SecureRandom.uuid,
                                                       payload: params.require(:submission).permit!.to_h,
                                                       campaign_id: params[:campaign_id])
          render json: { submission_id: submission.id, status: submission.status }, status: :accepted
        rescue ActiveRecord::RecordNotUnique
          render json: { error: 'submission já processada' }, status: :conflict
        end
      end
    end
  end
end
