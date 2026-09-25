module Api
  module V1
    module Sales
      class FormsController < BaseController
        MAX_PAYLOAD_BYTES = 16.kilobytes
        MAX_FIELD_BYTES = 2.kilobytes

        skip_before_action :authenticate_api_user, only: %i[show submit]
        skip_before_action :require_internal_sales, only: %i[show submit]

        def show
          form = public_form
          return render_invalid_form unless publicly_available?(form)

          render json: { form: { name: form.name, public_key: form.public_key, fields: form.fields } }
        end

        def submit
          return render_oversized_payload if request.raw_post.bytesize > MAX_PAYLOAD_BYTES

          form = public_form
          return render_invalid_form unless publicly_available?(form)

          payload = safe_submission_payload(form)
          return render_invalid_payload unless payload

          key = idempotency_key(form, payload)
          existing = form.submissions.find_by(idempotency_key: key)
          return render_submission(existing) if existing

          submission = form.submissions.create!(idempotency_key: key, payload: payload, campaign: form.campaign)
          render_submission(submission)
        rescue ActiveRecord::RecordNotUnique
          submission = ::Sales::FormSubmission.find_by!(form_id: form.id,
                                                        idempotency_key: idempotency_key(
                                                          form, payload
                                                        ))
          render_submission(submission)
        rescue ActionController::ParameterMissing
          render_invalid_payload
        rescue ActiveRecord::RecordInvalid => e
          raise unless e.record.errors.added?(:idempotency_key, :taken)

          submission = ::Sales::FormSubmission.find_by!(form_id: form.id,
                                                        idempotency_key: idempotency_key(form, payload))
          render_submission(submission)
        end

        private

        def public_form
          ::Sales::Form.find_by!(public_key: params[:id], active: true)
        end

        def publicly_available?(form)
          return false unless form.company_id.present?
          return true unless form.campaign_id.present?

          form.campaign&.company_id == form.company_id
        end

        def safe_submission_payload(form)
          submission = params.require(:submission)
          return unless submission.is_a?(ActionController::Parameters)

          allowed = Array(form.fields).filter_map do |field|
            next unless field.is_a?(Hash)

            field['key'].presence || field['name'].presence || field[:key].presence || field[:name].presence
          end.map(&:to_s)
          input = submission.to_unsafe_h
          return unless input.present? && (input.keys - allowed).empty?

          input.each_with_object({}) do |(key, value), result|
            return unless value.is_a?(String) || value.is_a?(Numeric) || [true, false].include?(value)
            return if value.is_a?(String) && value.bytesize > MAX_FIELD_BYTES

            result[key] = value.is_a?(String) ? value.strip : value
          end
        end

        def idempotency_key(form, payload)
          supplied = request.headers['Idempotency-Key'].to_s.first(128)
          material = supplied.present? ? supplied : payload.sort.to_h.to_json
          Digest::SHA256.hexdigest("#{form.public_key}:#{material}")
        end

        def render_submission(submission)
          render json: { submission_id: submission.id, status: submission.status }, status: :accepted
        end

        def render_invalid_form
          render_error_response(message: 'Formulário público indisponível.', status: :not_found, code: 'FORM_NOT_FOUND')
        end

        def render_invalid_payload
          render_error_response(message: 'Campos enviados não correspondem ao formulário ou excedem os limites.',
                                status: :unprocessable_entity, code: 'FORM_SUBMISSION_INVALID')
        end

        def render_oversized_payload
          render_error_response(message: 'Payload excede o limite de 16 KB.', status: :unprocessable_entity,
                                code: 'FORM_PAYLOAD_TOO_LARGE')
        end
      end
    end
  end
end
