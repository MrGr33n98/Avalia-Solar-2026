# frozen_string_literal: true

require 'digest'

module Api
  module V1
    class MaterialDownloadsController < BaseController
      TOKEN_TTL = 15.minutes

      def create
        return render_spam_detected if params[:company_website].present?

        company = ::Company.find_by(id: params.require(:company_id)) || ::Company.find_by(slug: params.require(:company_id))
        return render json: { error: 'Empresa não encontrada' }, status: :not_found if company.nil?

        material = company.company_materials.published.find_by(slug: params.require(:material_slug))
        return render json: { error: 'Material não encontrado' }, status: :not_found if material.nil?

        unless company.respond_to?(:feature_enabled?) && company.feature_enabled?('downloadable_materials')
          return render json: { error: 'Funcionalidade de download não habilitada para esta empresa' }, status: :forbidden
        end

        if material.gated?
          form = material.content_lead_form
          if form.nil? || form.status != 'active'
            return render json: { error: 'Formulário de captura não está ativo ou disponível' }, status: :unprocessable_entity
          end
        end

        token = authorization_token
        download = create_download!(material, token)

        track_server_event('material_form_submitted', material, download) if material.gated?
        track_server_event('material_download_authorized', material, download)

        Rails.logger.info("[MaterialDownloadsController#create] company_id=#{company.id} material_id=#{material.id} download_id=#{download.id} status=authorized utm_source=#{params[:utm_source]}")

        render json: {
          download_id: download.id,
          delivery_url: "/api/v1/material_downloads/#{download.id}/file?token=#{token}",
          expires_at: download.expires_at
        }, status: :created
      rescue ActionController::ParameterMissing => e
        render json: { error: e.message }, status: :bad_request
      rescue StandardError => e
        Rails.logger.error("[MaterialDownloadsController#create] error=#{e.class} message=#{e.message} backtrace=#{e.backtrace&.first(5)&.join(' | ')}")
        render json: { error: 'Erro interno ao processar autorização de download' }, status: :internal_server_error
      end

      def file
        download = ::MaterialDownload.includes(company_material: :digital_assets).find_by(id: params[:id])
        return render json: { error: 'Download não encontrado' }, status: :not_found if download.nil?

        return render json: { error: 'Token inválido ou expirado' }, status: :forbidden unless valid_token?(download)

        asset = download.company_material.digital_assets.published.document.first
        return render json: { error: 'Arquivo indisponível' }, status: :not_found unless asset&.file&.attached?

        first_delivery = download.delivered_at.blank?
        if first_delivery
          download.update!(delivery_status: 'delivered', delivered_at: Time.current)
          download.company_material.increment!(:download_count)
          track_server_event('material_download_delivered', download.company_material, download)
        end

        Rails.logger.info("[MaterialDownloadsController#file] download_id=#{download.id} material_id=#{download.company_material_id} company_id=#{download.company_id} status=delivered first_delivery=#{first_delivery}")

        redirect_to rails_blob_url(asset.file, disposition: 'attachment'), allow_other_host: true
      rescue StandardError => e
        Rails.logger.error("[MaterialDownloadsController#file] error=#{e.class} message=#{e.message} backtrace=#{e.backtrace&.first(5)&.join(' | ')}")
        render json: { error: 'Erro interno ao processar entrega de arquivo' }, status: :internal_server_error
      end

      private

      def render_spam_detected
        render_error_response(message: 'Solicitação inválida', status: :unprocessable_entity, code: 'SPAM_DETECTED')
      end

      def create_download!(material, token)
        download = nil
        ::MaterialDownload.transaction do
          lead = material.gated? ? find_or_create_lead!(material) : nil
          download = find_or_create_download!(material, lead, token)
        end

        if download&.content_lead.present?
          begin
            MaterialDownloadMailer.download_link(download, token).deliver_later
          rescue StandardError => e
            Rails.logger.error("[MaterialDownloadsController#create_download!] Falha ao enfileirar e-mail: #{e.message}")
          end
        end

        download
      rescue ActiveRecord::RecordNotUnique
        key = request.headers['Idempotency-Key'].presence
        raise if key.blank?

        material.company.material_downloads.find_by!(idempotency_key: key, company_material_id: material.id)
      end

      def find_or_create_lead!(material)
        email = lead_params[:email].to_s.strip.downcase
        raise ActionController::ParameterMissing, :email if email.blank?

        lead = material.company.content_leads.find_or_initialize_by(email_digest: ::ContentLead.digest_for(email))
        lead.assign_attributes(
          email: email,
          name: lead_params[:name],
          phone: lead_params[:phone],
          company_name: lead_params[:company_name],
          attributes_data: lead_params[:attributes_data] || {},
          consents: { form_version: material.content_lead_form.version, accepted_at: Time.current.iso8601, marketing: ActiveModel::Type::Boolean.new.cast(lead_params[:marketing_consent]) },
          last_seen_at: Time.current
        )
        lead.save!
        lead
      end

      def find_or_create_download!(material, lead, token)
        key = request.headers['Idempotency-Key'].presence
        existing = material.company.material_downloads.find_by(idempotency_key: key) if key
        if existing
          raise ActiveRecord::RecordNotUnique, 'idempotency key reused for a different material' if existing.company_material_id != material.id

          return existing
        end

        ::MaterialDownload.create!(
          company: material.company,
          company_material: material,
          content_lead: lead,
          content_lead_form: material.content_lead_form,
          anonymous_id: cookies[:anonymous_id],
          authorization_token_digest: Digest::SHA256.hexdigest(token),
          authorized_at: Time.current,
          expires_at: TOKEN_TTL.from_now,
          delivery_status: 'authorized',
          idempotency_key: key,
          utm_source: params[:utm_source], utm_medium: params[:utm_medium], utm_campaign: params[:utm_campaign],
          referrer_host: referrer_host,
          form_submission: lead_params.except(:email, :name, :phone, :company_name, :marketing_consent, :attributes_data)
        )
      end

      def valid_token?(download)
        return false if download.expires_at <= Time.current || download.delivery_status.in?(%w[revoked expired])

        ActiveSupport::SecurityUtils.secure_compare(download.authorization_token_digest, Digest::SHA256.hexdigest(params[:token].to_s))
      end

      def authorization_token
        key = request.headers['Idempotency-Key'].presence
        return SecureRandom.urlsafe_base64(32) if key.blank?

        OpenSSL::HMAC.hexdigest('SHA256', Rails.application.secret_key_base, "material-download:#{key}")
      end

      def referrer_host
        URI.parse(request.referer).host if request.referer.present?
      rescue URI::InvalidURIError
        nil
      end

      def lead_params
        params.permit(:email, :name, :phone, :company_name, :marketing_consent, :utm_source, :utm_medium, :utm_campaign, attributes_data: {})
      end

      def track_server_event(event_name, material, download)
        Analytics::TrackEventService.call(
          company_id: material.company_id,
          event_type: event_name,
          metadata: {
            material_id: material.id,
            material_slug: material.slug,
            material_download_id: download.id,
            gate_mode: material.gate_mode,
            distinct_id: "content_lead_#{download.content_lead_id || download.anonymous_id || download.id}"
          },
          event_id: "material-download:#{download.id}:#{event_name}"
        )
      rescue StandardError => error
        Rails.logger.warn("[MaterialDownloads] analytics failed: #{error.class}")
      end
    end
  end
end

