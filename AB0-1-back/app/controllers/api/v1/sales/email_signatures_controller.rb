# frozen_string_literal: true

module Api
  module V1
    module Sales
      class EmailSignaturesController < BaseController
        def index
          render json: { signatures: scoped_signatures.order(is_default: :desc, updated_at: :desc).map { |signature| serialize(signature) } }
        end

        # POST /api/v1/sales/email_signatures/upload_asset
        def upload_asset
          kind = params[:kind].to_s == 'logo' ? 'logo' : 'avatar'
          uploaded_file = params[:file]
          data_url = params[:data_url]

          blob = if uploaded_file.respond_to?(:content_type) && uploaded_file.respond_to?(:size)
                   validate_uploaded_file!(uploaded_file)
                   ActiveStorage::Blob.create_and_upload!(
                     io: uploaded_file,
                     filename: uploaded_file.original_filename.presence || "signature-#{kind}-#{Time.current.to_i}.png",
                     content_type: uploaded_file.content_type
                   )
                 elsif data_url.present?
                   create_blob_from_data_url!(data_url, kind: kind)
                 else
                   return render_error_response(message: 'Nenhum arquivo de imagem enviado.', status: :bad_request, code: 'FILE_REQUIRED')
                 end

          public_url = ::Sales::EmailSignature.blob_public_url(blob)
          unless public_url.present?
            return render_error_response(message: 'Falha ao gerar URL pública para a imagem.', status: :unprocessable_entity, code: 'URL_GENERATION_FAILED')
          end

          # Se o usuário já possui uma assinatura padrão, anexa o ativo imediatamente
          default_sig = scoped_signatures.find_by(is_default: true) || scoped_signatures.first
          if default_sig
            if kind == 'logo'
              default_sig.logo.attach(blob)
            else
              default_sig.avatar.attach(blob)
            end
          end

          render json: {
            url: public_url,
            signed_id: blob.signed_id,
            kind: kind,
            filename: blob.filename.to_s,
            byte_size: blob.byte_size,
            content_type: blob.content_type
          }, status: :created
        rescue ArgumentError => e
          render_error_response(message: e.message, status: :unprocessable_entity, code: 'INVALID_IMAGE_ASSET')
        rescue StandardError => e
          Rails.logger.error("[EmailSignaturesController#upload_asset] #{e.class}: #{e.message}")
          render_error_response(message: "Erro ao processar upload da imagem: #{e.message}", status: :unprocessable_entity, code: 'UPLOAD_FAILED')
        end

        def create
          validate_email_account!
          attrs = build_persistence_attributes
          signature = scoped_signatures.new(attrs.merge(company_id: current_user.company_id, user_id: current_user.id))
          attach_signed_blobs(signature)
          signature.save!
          set_default!(signature) if signature.is_default?
          render json: { signature: serialize(signature.reload) }, status: :created
        rescue ActiveRecord::RecordInvalid => e
          render_error_response(message: e.record.errors.full_messages.to_sentence, status: :unprocessable_entity, code: 'SIGNATURE_INVALID')
        end

        def update
          validate_email_account!
          signature = scoped_signatures.find(params[:id])
          attach_signed_blobs(signature)
          signature.update!(build_persistence_attributes)
          set_default!(signature) if signature.is_default?
          render json: { signature: serialize(signature.reload) }
        rescue ActiveRecord::RecordInvalid => e
          render_error_response(message: e.record.errors.full_messages.to_sentence, status: :unprocessable_entity, code: 'SIGNATURE_INVALID')
        end

        def destroy
          scoped_signatures.find(params[:id]).destroy!
          render json: { message: 'Assinatura removida.' }
        end

        private

        def scoped_signatures
          return ::Sales::EmailSignature.where(company_id: current_user.company_id) if current_user.admin? && current_user.company_id.present?
          return ::Sales::EmailSignature.all if current_user.admin?

          ::Sales::EmailSignature.where(company_id: current_user.company_id, user_id: current_user.id)
        end

        def signature_params
          params.require(:signature).permit(
            :name,
            :body_html,
            :sales_email_account_id,
            :is_default,
            :avatar_signed_id,
            :logo_signed_id,
            settings: %i[
              full_name
              role_title
              email
              phone
              avatar_url
              logo_url
              website_url
              linkedin_url
              calendly_url
              cta_text
              footer_tagline
            ]
          )
        end

        def build_persistence_attributes
          permitted = signature_params.except(:avatar_signed_id, :logo_signed_id, :settings).to_h
          if ::Sales::EmailSignature.column_names.include?('settings') && signature_params[:settings].present?
            permitted[:settings] = signature_params[:settings].to_h
          end
          permitted
        end

        def attach_signed_blobs(signature)
          if signature_params[:avatar_signed_id].present?
            blob = ActiveStorage::Blob.find_signed(signature_params[:avatar_signed_id])
            signature.avatar.attach(blob) if blob
          end
          if signature_params[:logo_signed_id].present?
            blob = ActiveStorage::Blob.find_signed(signature_params[:logo_signed_id])
            signature.logo.attach(blob) if blob
          end
        rescue StandardError => e
          Rails.logger.warn("[EmailSignaturesController] Falha ao anexar blob assinado: #{e.message}")
        end

        def validate_uploaded_file!(file)
          content_type = file.content_type.to_s.downcase
          unless ::Sales::EmailSignature::ALLOWED_IMAGE_CONTENT_TYPES.include?(content_type)
            raise ArgumentError, 'Formato inválido. Envie PNG, JPG ou WEBP.'
          end

          if file.size > ::Sales::EmailSignature::MAX_IMAGE_SIZE_BYTES
            raise ArgumentError, 'A imagem excede o tamanho máximo permitido de 5 MB.'
          end
        end

        def create_blob_from_data_url!(data_url, kind:)
          match = data_url.to_s.match(/\Adata:(image\/[a-zA-Z0-9.+-]+);base64,(.+)\z/m)
          raise ArgumentError, 'Data URI de imagem inválido.' unless match

          content_type = match[1].downcase
          unless ::Sales::EmailSignature::ALLOWED_IMAGE_CONTENT_TYPES.include?(content_type)
            raise ArgumentError, 'Formato inválido. Envie PNG, JPG ou WEBP.'
          end

          decoded = Base64.decode64(match[2])
          if decoded.bytesize.zero? || decoded.bytesize > ::Sales::EmailSignature::MAX_IMAGE_SIZE_BYTES
            raise ArgumentError, 'Tamanho da imagem inválido (máximo 5 MB).'
          end

          ext = content_type.split('/').last.sub('jpeg', 'jpg')
          ActiveStorage::Blob.create_and_upload!(
            io: StringIO.new(decoded),
            filename: "signature-#{kind}-#{Time.current.to_i}.#{ext}",
            content_type: content_type
          )
        end

        def validate_email_account!
          account_id = signature_params[:sales_email_account_id]
          return if account_id.blank?

          scope = ::Sales::EmailAccount.where(id: account_id)
          scope = scope.where(user_id: current_user.id, company_id: current_user.company_id) unless current_user.admin?
          raise ActiveRecord::RecordNotFound unless scope.exists?
        end

        def set_default!(signature)
          scoped_signatures.where.not(id: signature.id).update_all(is_default: false)
        end

        def serialize(signature)
          normalized_html = ::Sales::EmailSignature.normalize_html(signature.body_html)

          # Se há avatar/logo anexado no Active Storage, garante que o HTML entregue reflita a URL HTTPS do blob
          if signature.avatar.attached?
            blob_avatar_url = signature.avatar_public_url
            if blob_avatar_url.present?
              normalized_html = normalized_html.sub(/(<img\b[^>]*src=["'])([^"']+)(["'][^>]*width=["'](?:76|83)["'])/i, "\\1#{blob_avatar_url}\\3")
            end
          end

          if signature.logo.attached?
            blob_logo_url = signature.logo_public_url
            if blob_logo_url.present?
              normalized_html = normalized_html.sub(/(<img\b[^>]*src=["'])([^"']+)(["'][^>]*alt=["']Avalia Solar["'])/i, "\\1#{blob_logo_url}\\3")
            end
          end

          if normalized_html != signature.body_html && signature.persisted?
            signature.update_column(:body_html, normalized_html)
          end

          {
            id: signature.id,
            name: signature.name,
            body_html: normalized_html,
            sales_email_account_id: signature.sales_email_account_id,
            is_default: signature.is_default,
            avatar_url: signature.avatar_public_url,
            logo_url: signature.logo_public_url,
            fields: signature.structured_fields,
            updated_at: signature.updated_at
          }
        end
      end
    end
  end
end
