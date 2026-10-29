# frozen_string_literal: true

module Api
  module V1
    module Sales
      class InboxThreadsController < BaseController
        before_action :set_mailbox, only: %i[index]
        before_action :set_thread, only: %i[show update]

        # GET /api/v1/sales/email_threads
        def index
          reconcile_orphan_threads(@mailbox) if @mailbox

          threads_scope = mailbox_threads_scope(@mailbox)

          # Folder filter
          folder = params[:folder].presence || 'inbox'
          case folder
          when 'inbox'
            threads_scope = threads_scope.joins(:messages).where(sales_email_messages: { direction: 'inbound' }).distinct
          when 'sent'
            threads_scope = threads_scope.joins(:messages).where(sales_email_messages: { direction: 'outbound' }).distinct
          when 'drafts'
            threads_scope = threads_scope.joins(:messages).where(sales_email_messages: { status: 'draft' }).distinct
          when 'archived', 'archive'
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
                                         .where(
                                           'LOWER(COALESCE(sales_email_threads.subject_normalized, \'\')) LIKE ? OR LOWER(COALESCE(sales_email_messages.subject, \'\')) LIKE ? OR LOWER(COALESCE(sales_email_messages.from_email, \'\')) LIKE ? OR LOWER(COALESCE(sales_email_messages.to_email, \'\')) LIKE ?',
                                           query, query, query, query
                                         )
                                         .distinct
          end

          # Order
          threads_scope = threads_scope.order(Arel.sql('COALESCE(sales_email_threads.last_message_at, sales_email_threads.updated_at) DESC'))

          page = [params[:page].to_i, 1].max
          raw_per_page = params[:per_page].to_i
          per_page = raw_per_page.positive? ? [raw_per_page, 50].min : 25

          total_records = threads_scope.count
          records = threads_scope.includes(:contact, :account, :opportunity, :assigned_user, :messages)
                                 .offset((page - 1) * per_page)
                                 .limit(per_page)

          # Folder counts (column-safe for `is_read` before/after migration)
          base_mailbox_threads = mailbox_threads_scope(@mailbox)
          unread_count = compute_unread_threads_count(base_mailbox_threads)

          counts = {
            inbox: base_mailbox_threads.joins(:messages).where(sales_email_messages: { direction: 'inbound' }).distinct.count,
            sent: base_mailbox_threads.joins(:messages).where(sales_email_messages: { direction: 'outbound' }).distinct.count,
            drafts: base_mailbox_threads.joins(:messages).where(sales_email_messages: { status: 'draft' }).distinct.count,
            unread: unread_count,
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
          mark_thread_messages_read!(@thread)
          render json: {
            thread: serialize_thread_detail(@thread)
          }
        end

        # PATCH /api/v1/sales/email_threads/:id
        def update
          src = params[:thread].is_a?(ActionController::Parameters) || params[:thread].is_a?(Hash) ? params[:thread] : params
          attrs = {}
          if src[:status].present? && ::Sales::EmailThread::STATUSES.include?(src[:status])
            attrs[:status] = src[:status]
          end
          if src.key?(:assigned_user_id)
            attrs[:assigned_user_id] = src[:assigned_user_id]
          end
          if src.key?(:sales_contact_id)
            attrs[:sales_contact_id] = src[:sales_contact_id]
          end
          if src.key?(:sales_account_id)
            attrs[:sales_account_id] = src[:sales_account_id]
          end
          if src.key?(:sales_opportunity_id)
            attrs[:sales_opportunity_id] = src[:sales_opportunity_id]
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

        def mailbox_threads_scope(mailbox)
          base = ::Sales::EmailThread.where(company_id: current_user.company_id)
          return base unless mailbox

          base.where(sales_email_account_id: mailbox.id)
        end

        def reconcile_orphan_threads(mailbox)
          return unless mailbox

          orphan_thread_ids = ::Sales::EmailMessage.where(
            company_id: current_user.company_id,
            sales_email_account_id: mailbox.id
          ).where.not(sales_email_thread_id: nil).distinct.pluck(:sales_email_thread_id)

          return if orphan_thread_ids.empty?

          ::Sales::EmailThread.where(id: orphan_thread_ids, sales_email_account_id: nil)
                              .update_all(sales_email_account_id: mailbox.id)
        rescue StandardError => e
          Rails.logger.warn("[InboxThreadsController] reconcile_orphan_threads warning: #{e.message}")
        end

        def compute_unread_threads_count(scope)
          cols = ::Sales::EmailMessage.column_names
          if cols.include?('is_read')
            scope.joins(:messages).where(sales_email_messages: { direction: 'inbound', is_read: false }).distinct.count
          elsif cols.include?('read_at')
            scope.joins(:messages).where(sales_email_messages: { direction: 'inbound', read_at: nil }).distinct.count
          else
            0
          end
        rescue StandardError => e
          Rails.logger.warn("[InboxThreadsController] compute_unread_threads_count fallback: #{e.message}")
          0
        end

        def mark_thread_messages_read!(thread)
          cols = ::Sales::EmailMessage.column_names
          updates = {}
          updates[:is_read] = true if cols.include?('is_read')
          updates[:read_at] = Time.current if cols.include?('read_at')
          return if updates.empty?

          scope = thread.messages.where(direction: 'inbound')
          scope = scope.where(is_read: false) if cols.include?('is_read')
          scope.update_all(updates)
        rescue StandardError => e
          Rails.logger.warn("[InboxThreadsController] mark_thread_messages_read! warning: #{e.message}")
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
          msg_count = thread.messages.size
          {
            id: thread.id,
            sales_email_account_id: thread.sales_email_account_id,
            subject: latest&.subject.presence || thread.subject_normalized.presence || '(Sem assunto)',
            status: thread.status || 'open',
            first_message_at: thread.first_message_at,
            last_message_at: thread.last_message_at || thread.updated_at,
            message_count: msg_count,
            messages_count: msg_count,
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
