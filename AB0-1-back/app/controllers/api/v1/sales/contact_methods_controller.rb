# frozen_string_literal: true

module Api
  module V1
    module Sales
      class ContactMethodsController < BaseController
        before_action :set_contact
        before_action :set_contact_method, only: %i[update destroy primary]

        def index
          methods = @contact.contact_methods.active.ordered
          render json: { contact_methods: methods.map { |m| serialize(m) } }
        end

        def create
          method = ::Sales::ContactMethods::Upsert.call(
            contact: @contact,
            attributes: contact_method_params,
            actor: current_user
          )

          render json: { contact_method: serialize(method) }, status: :created
        rescue ::Sales::ContactMethods::Upsert::DuplicateError => e
          render_error_response(message: e.message, status: :conflict, code: 'CONTACT_METHOD_DUPLICATE')
        rescue ActiveRecord::RecordInvalid => e
          render_error_response(message: e.record.errors.full_messages.join(', '), status: :unprocessable_entity, code: 'INVALID_CONTACT_METHOD')
        rescue StandardError => e
          render_error_response(message: e.message, status: :bad_request, code: 'INVALID_CONTACT_METHOD')
        end

        def update
          method = ::Sales::ContactMethods::Upsert.call(
            contact: @contact,
            method_id: @contact_method.id,
            attributes: contact_method_params,
            actor: current_user
          )

          render json: { contact_method: serialize(method) }
        rescue ::Sales::ContactMethods::Upsert::DuplicateError => e
          render_error_response(message: e.message, status: :conflict, code: 'CONTACT_METHOD_DUPLICATE')
        rescue ActiveRecord::RecordInvalid => e
          render_error_response(message: e.record.errors.full_messages.join(', '), status: :unprocessable_entity, code: 'INVALID_CONTACT_METHOD')
        rescue StandardError => e
          render_error_response(message: e.message, status: :bad_request, code: 'INVALID_CONTACT_METHOD')
        end

        def primary
          method = ::Sales::ContactMethods::SetPrimary.call(
            contact_method: @contact_method,
            actor: current_user
          )

          render json: { contact_method: serialize(method) }
        rescue StandardError => e
          render_error_response(message: e.message, status: :unprocessable_entity, code: 'SET_PRIMARY_FAILED')
        end

        def destroy
          ::Sales::ContactMethods::Archive.call(
            contact_method: @contact_method,
            actor: current_user,
            replacement_id: params[:replacement_id]
          )

          render json: { success: true, message: 'Canal de contato arquivado com sucesso.' }
        rescue StandardError => e
          render_error_response(message: e.message, status: :unprocessable_entity, code: 'ARCHIVE_FAILED')
        end

        private

        def set_contact
          contact_id = params[:contact_id] || params[:id]
          @contact = current_tenant_scope.contacts.find(contact_id)
        end

        def set_contact_method
          @contact_method = @contact.contact_methods.active.find(params[:id] || params[:method_id])
        end

        def contact_method_params
          params.require(:contact_method).permit(
            :kind,
            :value,
            :label,
            :is_primary,
            :position,
            :source
          ).to_h
        end

        def serialize(method)
          {
            id: method.id,
            contact_id: method.sales_contact_id,
            kind: method.kind,
            value: method.value,
            normalized_value: method.normalized_value,
            label: method.label,
            is_primary: method.is_primary,
            position: method.position,
            source: method.source,
            created_at: method.created_at,
            updated_at: method.updated_at
          }
        end
      end
    end
  end
end
