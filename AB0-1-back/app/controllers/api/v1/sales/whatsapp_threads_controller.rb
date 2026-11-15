# frozen_string_literal: true

module Api
  module V1
    module Sales
      # Read-only metadata endpoint; no phone numbers or conversation bodies.
      class WhatsappThreadsController < BaseController
        before_action :require_read_permission!

        def index
          scope = visible_threads.includes(:account, :contact).recent.limit(100)
          render json: { threads: scope.map { |thread| serialize(thread) } }
        end

        def show
          thread = visible_threads.includes(:account, :contact).find(params[:id])
          render json: {
            thread: serialize(thread),
            messages: thread.messages.order(occurred_at: :desc).limit(100).reverse.map do |message|
              {
                id: message.id, direction: message.direction, intent: message.intent,
                message_type: message.message_type, occurred_at: message.occurred_at
              }
            end
          }
        end

        private

        def require_read_permission!
          require_sales_permission!('accounts', 'read')
        end

        def visible_threads
          tenant_id = current_user&.company_id
          return ::Sales::WhatsappThread.none if tenant_id.blank?

          base = ::Sales::WhatsappThread.where(company_id: tenant_id)
          base.where(sales_account_id: nil).or(
            base.where(sales_account_id: current_tenant_scope.accounts.select(:id))
          )
        end

        def serialize(thread)
          {
            id: thread.id, status: thread.status, last_intent: thread.last_intent,
            last_message_at: thread.last_message_at,
            account: thread.account && { id: thread.account.id, name: thread.account.name },
            contact: thread.contact && {
              id: thread.contact.id,
              name: [thread.contact.first_name, thread.contact.last_name].compact.join(' ')
            }
          }
        end
      end
    end
  end
end
