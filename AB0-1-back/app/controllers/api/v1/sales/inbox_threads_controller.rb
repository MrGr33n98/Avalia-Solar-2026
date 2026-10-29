# frozen_string_literal: true

module Api
  module V1
    module Sales
      class InboxThreadsController < BaseController
        before_action :set_mailbox, only: %i[index]
        before_action :set_thread, only: %i[show update]

        # GET /api/v1/sales/email_threads
        def index
          threads_scope = ::Sales::EmailThread.where(company_id: current_user.company_id)
          threads_scope = threads_scope.where(sales_email_account_id: @mailbox.id) if @mailbox

          # Folder filter
          folder = params[:folder].presence || 'inbox'
          case folder
          when 'inbox'
            threads_scope = threads_scope.joins(:messages).where(sales_email_messages: { direction: 'inbound' }).distinct
          when 'sent'
            threads_scope = threads_scope.joins(:messages).where(sales_email_messages: { direction: 'outbound' }).distinct
          when 'drafts'
            threads_scope = threads_scope.joins(:messages).where(sales_email_messages: { status: 'draft' }).distinct
          when 'archived'
            threads_scope = threads_scope.where(status: 'archived')
          end

          # Status filter
          if params[:status].present? && ::Sales::EmailThread::STATUSES.include?(params[:status])
            threads_scope = threads_scope.where(status: params[:status])
          end

          # Search query (supports both `q` and `search`)
          raw_search = params[:q].presence || params[:search].presence
          if raw_search.present?
            query = "%#{raw_search.to_s.strip.downcase}%"
            threads_scope = threads_scope.joins(:messages)
                                         .where('LOWER(sales_email_threads.subject_normalized) LIKE ? OR LOWER(sales_email_messages.from_email) LIKE ? OR LOWER(sales_email_messages.to_email) LIKE ?', query, query, query)
                                         .distinct
          end

          # Order
          threads_scope = threads_scope.order(last_message_at: :desc)

          page = [params[:page].to_i, 1].max
          raw_per_page = params[:per_page].to_i
          per_page = raw_per_page.positive? ? [raw_per_page, 50].min : 25

          total_records = threads_scope.count
          records = threads_scope.offset((page - 1) * per_page).limit(per_page)

          # Folder counts
          base_mailbox_threads = @mailbox ? ::Sales::EmailThread.where(company_id: current_user.company_id, sales_email_account_id: @mailbox.id) : ::Sales::EmailThread.where(company_id: current_user.company_id)
          counts = {
            inbox: base_mailbox_threads.joins(:messages).where(sales_email_messages: { direction: 'inbound' }).distinct.count,
            sent: base_mailbox_threads.joins(:messages).where(sales_email_messages: { direction: 'outbound' }).distinct.count,
            drafts: 0,
            unread: base_mailbox_threads.joins(:messages).where(sales_email_messages: { is_read: false }).distinct.count,
            all: base_mailbox_threads.count,
            open: base_mailbox_threads.where(status: 'open').count,
            pending: base_mailbox_threads.where(status: 'pending').count,
            resolved: base_mailbox_threads.where(status: 'resolved').count,
            archived: base_mailbox_threads.where(status: 'archived').count
          }

          render json: {
            threads: records.map { |t| serialize_thread_summary(t) },
            counts: counts,
            meta: {
              page: page,
              per_page: per_page,
              total_records: total_records,
              total_pages: (total_records.to_f / per_page).ceil
            }
          }
        end

        # GET /api/v1/sales/email_threads/:id
        def show
          render json: {
            thread: serialize_thread_detail(@thread)
          }
        end

        # PATCH /api/v1/sales/email_threads/:id
        def update
          attrs = {}
          if params[:status].present? && ::Sales::EmailThread::STATUSES.include?(params[:status])
            attrs[:status] = params[:status]
          end
          if params.key?(:assigned_user_id)
            attrs[:assigned_user_id] = params[:assigned_user_id]
          end
          if params.key?(:sales_contact_id)
            attrs[:sales_contact_id] = params[:sales_contact_id]
          end
          if params.key?(:sales_account_id)
            attrs[:sales_account_id] = params[:sales_account_id]
          end
          if params.key?(:sales_opportunity_id)
            attrs[:sales_opportunity_id] = params[:sales_opportunity_id]
          end

          @thread.update!(attrs)
          render json: { thread: serialize_thread_detail(@thread) }
        rescue ActiveRecord::RecordInvalid => e
          render_error_response(message: e.message, status: :unprocessable_entity, code: 'THREAD_UPDATE_INVALID')
        end

        private

        def set_mailbox
          if params[:mailbox_id].present?
            @mailbox = ::Sales::EmailAccount.where(company_id: current_user.company_id, user_id: current_user.id)
                                            .find_by(id: params[:mailbox_id])
          else
            @mailbox = ::Sales::EmailAccount.where(company_id: current_user.company_id, user_id: current_user.id)
                                            .order(created_at: :asc)
                                            .first
          end
        end

        def set_thread
          @thread = ::Sales::EmailThread.where(company_id: current_user.company_id).find(params[:id])
          if @thread.email_account && @thread.email_account.user_id != current_user.id && !current_user.admin?
            render_error_response(message: 'Sem permissão para acessar esta conversa.', status: :forbidden, code: 'FORBIDDEN')
          end
        rescue ActiveRecord::RecordNotFound
          render_error_response(message: 'Conversa não encontrada.', status: :not_found, code: 'THREAD_NOT_FOUND')
        end

        def serialize_thread_summary(thread)
          latest = thread.latest_message
          contact_full_name = thread.contact ? "#{thread.contact.first_name} #{thread.contact.last_name}".strip : nil
          {
            id: thread.id,
            sales_email_account_id: thread.sales_email_account_id,
            subject: thread.subject_normalized.presence || latest&.subject || '(Sem assunto)',
            status: thread.status || 'open',
            first_message_at: thread.first_message_at,
            last_message_at: thread.last_message_at || thread.updated_at,
            message_count: thread.messages.count,
            messages_count: thread.messages.count,
            unread_count: thread.unread_messages_count,
            assigned_user: thread.assigned_user ? { id: thread.assigned_user.id, name: thread.assigned_user.name } : nil,
            assigned_user_name: thread.assigned_user&.name,
            contact: thread.contact ? { id: thread.contact.id, name: contact_full_name, email: thread.contact.email, phone: thread.contact.phone } : nil,
            contact_name: contact_full_name,
            sales_contact_id: thread.sales_contact_id,
            account: thread.account ? { id: thread.account.id, name: thread.account.name } : nil,
            company_name: thread.account&.name,
            sales_account_id: thread.sales_account_id,
            opportunity: thread.opportunity ? { id: thread.opportunity.id, name: thread.opportunity.name, stage: thread.opportunity.stage, value_cents: thread.opportunity.value_cents } : nil,
            opportunity_title: thread.opportunity&.name,
            opportunity_stage: thread.opportunity&.stage,
            sales_opportunity_id: thread.sales_opportunity_id,
            snippet: latest&.body_text&.truncate(140),
            latest_message_snippet: latest&.body_text&.truncate(140),
            sender_name: contact_full_name.presence || latest&.from_email,
            sender_email: latest&.from_email,
            latest_message_from: latest&.from_email,
            direction: latest&.direction || 'inbound',
            latest_message_direction: latest&.direction
          }
        end

        def serialize_thread_detail(thread)
          detail = serialize_thread_summary(thread).merge(
            provider_thread_id: thread.provider_thread_id
          )
          detail[:messages] = thread.messages.order(created_at: :asc).map { |m| serialize_message(m) }
          detail
        end

        def serialize_message(msg)
          {
            id: msg.id,
            from_name: msg.from_email.to_s.split('@').first.to_s.capitalize,
            from_email: msg.from_email,
            to_email: msg.to_email,
            subject: msg.subject,
            direction: msg.direction || 'outbound',
            status: msg.status,
            delivery_status: msg.delivery_status,
            body_text: msg.body_text,
            body_html: msg.body_html.presence || msg.body_json&.dig('html'),
            provider_message_id: msg.provider_message_id,
            received_at: msg.provider_received_at || msg.created_at,
            created_at: msg.created_at,
            cc: msg.raw_headers.is_a?(Hash) ? (msg.raw_headers['cc'] || []) : [],
            bcc: msg.raw_headers.is_a?(Hash) ? (msg.raw_headers['bcc'] || []) : [],
            attachments: msg.attachments.map do |a|
              { id: a.id, file_name: a.file_name, filename: a.file_name, file_size: a.file_size, content_type: a.content_type }
            end
          }
        end
      end
    end
  end
end
