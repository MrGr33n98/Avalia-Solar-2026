require 'digest'
require 'rqrcode'

module Api
  module V1
    class PublicReviewFormsController < BaseController
      RATE_LIMIT = 5
      RATE_WINDOW = 1.hour

      before_action :set_review_form
      before_action :ensure_active, except: :qr_code

      def show
        record_event(params[:source] == 'qr' ? 'qr_scanned' : 'form_viewed')
        track_public_event('public_review_form_viewed')
        render json: { review_form: serialize_public_form(@review_form) }
      end

      def submit
        return head :no_content if params[:website].present?
        return render_rate_limited if rate_limited?
        return render json: { errors: ['O consentimento LGPD é obrigatório.'] }, status: :unprocessable_entity unless ActiveModel::Type::Boolean.new.cast(params[:consent_given])
        return render json: { errors: ['Informe seu nome.'] }, status: :unprocessable_entity if params[:reviewer_name].blank?
        return render json: { errors: ['Informe e-mail ou WhatsApp.'] }, status: :unprocessable_entity if params[:contact].blank?

        source = params[:source] == 'qr' ? 'qr_code_form' : 'custom_review_form'
        category = @review_form.company.categories.first
        review = @review_form.reviews.new(
          company: @review_form.company,
          category: category,
          rating: params[:rating],
          comment: params[:comment],
          capture_flow_source: source,
          is_legacy: category.nil?,
          form_answers: permitted_answers,
          verification_status: 'pending',
          metadata: {
            reviewer_name: params[:reviewer_name].to_s.strip,
            reviewer_contact: params[:contact].to_s.strip,
            city: params[:city].to_s.strip,
            state: params[:state].to_s.strip.upcase.first(2),
            real_experience_confirmed: ActiveModel::Type::Boolean.new.cast(params[:real_experience]),
            lgpd_consent: true,
            lgpd_consent_at: Time.current.iso8601,
            source_channel: source,
            source_token: @review_form.token,
            landing_path: request.path.to_s.first(500),
            referrer: request.referer.to_s.first(500),
            user_agent: request.user_agent.to_s.first(500),
            ip_hash: hashed_ip,
            submitted_at: Time.current.iso8601
          }
        )

        if review.save
          record_event('review_submitted', review_id: review.id)
          run_moderation(review)
          track_posthog('public_review_form_submitted', review)
          render json: { review_id: review.id, message: @review_form.settings['thank_you_message'] }, status: :created
        else
          render json: { errors: review.errors.full_messages }, status: :unprocessable_entity
        end
      end

      def event
        return render json: { error: 'Invalid event' }, status: :unprocessable_entity unless params[:event_type] == 'review_started'

        record_event('review_started')
        track_public_event('public_review_form_started')
        head :no_content
      end

      def qr_code
        url = "#{frontend_origin}#{@review_form.public_path}?source=qr"
        png = RQRCode::QRCode.new(url, level: :m).as_png(size: 480, border_modules: 4)
        record_event('qr_downloaded') if ActiveModel::Type::Boolean.new.cast(params[:download])
        send_data png.to_s, type: 'image/png', disposition: params[:download].present? ? 'attachment' : 'inline', filename: "qr-#{@review_form.slug}.png"
      end

      private

      def set_review_form
        @review_form = ReviewForm.includes(:company).find_by!(token: params[:token])
      end

      def ensure_active
        render json: { error: 'Este formulário não está disponível.' }, status: :gone unless @review_form.active?
      end

      def serialize_public_form(form)
        {
          id: form.id,
          public_title: form.public_title,
          public_description: form.public_description,
          form_type: form.form_type,
          settings: form.settings,
          company: { id: form.company.id, name: form.company.name, slug: form.company.slug, logo_url: form.company.logo_url }
        }
      end

      def permitted_answers
        params[:answers].respond_to?(:permit!) ? params[:answers].permit!.to_h : {}
      end

      def record_event(event_type, metadata = {})
        @review_form.review_form_events.create!(
          company: @review_form.company,
          event_type: event_type,
          source: params[:source].presence || 'link',
          ip_hash: hashed_ip,
          referrer: request.referer.to_s.first(500),
          user_agent: request.user_agent.to_s.first(500),
          metadata: metadata
        )
      rescue StandardError => e
        Rails.logger.warn("[ReviewForms] failed to record #{event_type}: #{e.message}")
      end

      def hashed_ip
        Digest::SHA256.hexdigest("#{Rails.application.secret_key_base}:#{request.remote_ip}")
      end

      def rate_limited?
        key = "review-form-submit:#{@review_form.id}:#{hashed_ip}"
        attempts = Rails.cache.read(key).to_i
        Rails.cache.write(key, attempts + 1, expires_in: RATE_WINDOW)
        attempts >= RATE_LIMIT
      end

      def render_rate_limited
        render json: { errors: ['Muitas tentativas. Tente novamente mais tarde.'] }, status: :too_many_requests
      end

      def run_moderation(review)
        Reviews::ModerationService.new.evaluate(review)
      rescue StandardError => e
        Rails.logger.warn("[ReviewForms] moderation failed for review=#{review.id}: #{e.message}")
      end

      def track_posthog(event_name, review)
        track_public_event(event_name, source: review.capture_flow_source, city: review.metadata['city'], state: review.metadata['state'])
      end

      def track_public_event(event_name, extra = {})
        Analytics::PostHogService.capture(
          event_name,
          { company_id: @review_form.company_id, company_slug: @review_form.company.slug, review_form_id: @review_form.id, form_type: @review_form.form_type, source: params[:source].presence || 'link' }.merge(extra),
          distinct_id: "anon_#{hashed_ip.first(20)}"
        )
      end

      def frontend_origin
        ENV.fetch('FRONTEND_URL', 'https://www.avaliasolar.com.br').sub(%r{/+$}, '')
      end
    end
  end
end
