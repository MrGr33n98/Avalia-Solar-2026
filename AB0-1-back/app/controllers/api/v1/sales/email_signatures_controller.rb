# frozen_string_literal: true

module Api
  module V1
    module Sales
      class EmailSignaturesController < BaseController
        def index
          render json: { signatures: scoped_signatures.order(:name).map { |signature| serialize(signature) } }
        end

        def create
          validate_email_account!
          signature = scoped_signatures.create!(signature_params.merge(company_id: current_user.company_id, user_id: current_user.id))
          set_default!(signature) if signature.is_default?
          render json: { signature: serialize(signature) }, status: :created
        rescue ActiveRecord::RecordInvalid => e
          render_error_response(message: e.record.errors.full_messages.to_sentence, status: :unprocessable_entity, code: 'SIGNATURE_INVALID')
        end

        def update
          validate_email_account!
          signature = scoped_signatures.find(params[:id])
          signature.update!(signature_params)
          set_default!(signature) if signature.is_default?
          render json: { signature: serialize(signature) }
        end

        def destroy
          scoped_signatures.find(params[:id]).destroy!
          render json: { message: 'Assinatura removida.' }
        end

        private

        def scoped_signatures
          return ::Sales::EmailSignature.all if current_user.admin?
          ::Sales::EmailSignature.where(company_id: current_user.company_id, user_id: current_user.id)
        end

        def signature_params
          params.require(:signature).permit(:name, :body_html, :sales_email_account_id, :is_default)
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
          { id: signature.id, name: signature.name, body_html: signature.body_html,
            sales_email_account_id: signature.sales_email_account_id, is_default: signature.is_default,
            updated_at: signature.updated_at }
        end
      end
    end
  end
end
