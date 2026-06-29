module Api
  module V1
    module CompanyAdmin
      class ReviewFormsController < BaseController
        before_action :set_review_form, only: %i[show update destroy duplicate event]

        def index
          forms = policy_scope(@company.review_forms).recent_first
          render json: { review_forms: forms.map { |form| serialize_form(form) } }
        end

        def show
          authorize @review_form
          render json: { review_form: serialize_form(@review_form) }
        end

        def create
          form = @company.review_forms.new(review_form_params)
          authorize form
          return render json: { errors: form.errors.full_messages }, status: :unprocessable_entity unless form.save

          track_posthog('review_form_created', form)
          render json: { review_form: serialize_form(form) }, status: :created
        end

        def update
          authorize @review_form
          return render json: { errors: @review_form.errors.full_messages }, status: :unprocessable_entity unless @review_form.update(review_form_params)

          track_posthog('review_form_updated', @review_form)
          render json: { review_form: serialize_form(@review_form) }
        end

        def destroy
          authorize @review_form
          @review_form.update!(status: 'inactive')
          track_posthog('review_form_disabled', @review_form)
          render json: { review_form: serialize_form(@review_form) }
        end

        def duplicate
          authorize @review_form
          copy = @company.review_forms.new(
            @review_form.attributes.slice('public_title', 'public_description', 'form_type', 'settings')
          )
          copy.name = "Cópia de #{@review_form.name}"
          copy.status = 'active'
          return render json: { errors: copy.errors.full_messages }, status: :unprocessable_entity unless copy.save

          track_posthog('review_form_duplicated', copy)
          render json: { review_form: serialize_form(copy) }, status: :created
        end

        def event
          authorize @review_form
          event_type = params[:event_type].to_s
          return render json: { error: 'Invalid event' }, status: :unprocessable_entity unless ReviewFormEvent::EVENT_TYPES.include?(event_type)

          @review_form.review_form_events.create!(company: @company, event_type: event_type, source: params[:source].presence || 'dashboard')
          track_posthog("review_form_#{event_type}", @review_form)
          head :no_content
        end

        private

        def set_company
          requested_id = params[:company_id].presence
          if requested_id.present?
            unless current_user.admin? || current_user.active_membership_for?(requested_id)
              return render json: { error: 'Forbidden' }, status: :forbidden
            end
            @company = ::Company.find(requested_id)
          else
            @company = current_user.company
          end
          render json: { error: 'Company not found' }, status: :not_found unless @company
        end

        def set_review_form
          @review_form = @company.review_forms.find(params[:id])
        end

        def review_form_params
          params.require(:review_form).permit(
            :name, :public_title, :public_description, :form_type, :status, :is_default,
            settings: [:comment_required, :thank_you_message, :whatsapp_message, { criteria: [] }]
          )
        end

        def serialize_form(form)
          form.as_json(
            only: %i[id company_id name public_title public_description form_type slug token status is_default settings created_at updated_at]
          ).merge(public_path: form.public_path, qr_code_path: "/api/v1/review_forms/#{form.token}/qr_code", metrics: form.metrics)
        end

        def track_posthog(event_name, form)
          Analytics::PostHogService.capture(
            event_name,
            { company_id: @company.id, review_form_id: form.id, form_type: form.form_type },
            distinct_id: current_user.posthog_distinct_id
          )
        end
      end
    end
  end
end
