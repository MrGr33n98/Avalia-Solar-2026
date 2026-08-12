# frozen_string_literal: true

module Api
  module V1
    module Inbox
      class SessionsController < BaseController
        before_action :authenticate_api_user
        before_action :set_company
        before_action :set_session, except: :index

        def index
          # Usually index scope is handled by policy_scope, but here we enforce via @company
          authorize @company, :show? # Just ensure user can view the company
          scope = @company.chat_sessions.includes(:assigned_agent, :chat_lead).inbox_recent
          scope = scope.where(inbox_status: normalized_status) if normalized_status.present?
          if params[:q].present?
            term = "%#{ActiveRecord::Base.sanitize_sql_like(params[:q].to_s.strip)}%"
            scope = scope.left_joins(:chat_lead).where(
              'chat_leads.name ILIKE :term OR chat_leads.phone ILIKE :term OR chat_leads.city ILIKE :term',
              term: term
            )
          end

          limit = [[params.fetch(:limit, 30).to_i, 1].max, 100].min
          sessions = scope.limit(limit).to_a
          @last_messages_by_session = latest_messages_for(sessions.map(&:id))
          render json: {
            sessions: sessions.map { |session| serialize_session(session) },
            counts: inbox_counts
          }
        end

        def messages
          authorize @session, :show?
          limit = [[params.fetch(:limit, 50).to_i, 1].max, 100].min
          records = @session.chat_messages.includes(:sender).order(created_at: :desc).limit(limit).reverse
          render json: { messages: records.map { |message| serialize_message(message) } }
        end

        def activities
          authorize @session, :show?
          lead = @session.chat_lead
          activities = lead ? lead.chat_lead_activities.includes(:chat_lead).recent.limit(50) : []
          render json: { activities: activities.map { |activity| serialize_activity(activity) } }
        end

        def create_message
          authorize @session, :update?
          if params[:client_message_id].present?
            existing = @session.chat_messages.find_by(client_message_id: params[:client_message_id])
            return render json: serialize_message(existing), status: :ok if existing
          end

          message = ::Chat::AgentMessageService.call(
            session: @session,
            agent: current_user,
            content: params[:content],
            client_message_id: params[:client_message_id],
            attachment_ids: params[:attachment_ids]
          )
          render json: serialize_message(message), status: :created
        end

        def update_mode
          authorize @session, :update?
          mode = params.require(:mode).to_s
          unless ChatSession::MODES.include?(mode)
            return render_error_response(message: 'Modo inválido.', status: :unprocessable_entity, code: 'INVALID_MODE')
          end

          case mode
          when 'human_manual'
            @session.take_over!(agent: current_user)
          when 'bot_only'
            @session.return_to_bot!
          else
            @session.update!(mode: mode, inbox_status: 'active')
          end
          ::Chat::InboxBroadcastService.session_updated(@session.reload)
          render json: serialize_session(@session)
        end

        def mark_read
          @session.update!(company_unread_count: 0)
          ::Chat::InboxBroadcastService.session_updated(@session)
          render json: serialize_session(@session)
        end

        def archive
          @session.archive!
          ::Chat::InboxBroadcastService.session_updated(@session)
          render json: serialize_session(@session)
        end

        def handoff_whatsapp
          message = ::Chat::AgentMessageService.call(
            session: @session,
            agent: current_user,
            content: "[Sistema] O atendente iniciou um contato via WhatsApp."
          )
          render json: serialize_message(message), status: :created
        end

        private

        def set_company
          company_id = params[:company_id].presence || cookies.signed[:active_company_id]
          @company = Company.find(company_id)
          return if current_user.admin? || current_user.active_membership_for?(@company.id)

          render_error_response(
            message: 'Você não possui acesso a esta empresa.',
            status: :forbidden,
            code: 'COMPANY_ACCESS_REQUIRED'
          )
        end

        def set_session
          @session = @company.chat_sessions.find(params[:id])
        end

        def normalized_status
          value = params[:status].to_s
          return nil if value.blank? || value == 'all'
          return value if ChatSession.inbox_statuses.key?(value)

          nil
        end

        def inbox_counts
          raw = @company.chat_sessions.group(:inbox_status).count
          {
            all: raw.values.sum,
            waiting_agent: raw.fetch('waiting_agent', 0),
            in_progress: raw.fetch('in_progress', 0),
            archived: raw.fetch('archived', 0)
          }
        end

        def serialize_session(session)
          lead = session.chat_lead
          last_message = @last_messages_by_session&.fetch(session.id, nil) ||
                         session.chat_messages.order(created_at: :desc).first
          ::Chat::InboxBroadcastService.session_payload(session).merge(
            vertical: session.vertical,
            last_message: last_message && serialize_message(last_message),
            lead: lead && {
              id: lead.id,
              name: lead.name.presence || 'Visitante',
              email: lead.email,
              phone: lead.phone,
              city: lead.city,
              state: lead.state,
              score: lead.lead_score,
              temperature: lead.lead_temperature,
              monthly_bill: lead.monthly_bill,
              solution_type: lead.solution_type,
              project_type: lead.project_type,
              recommended_next_action: lead.recommended_next_action
            }
          )
        end

        def serialize_message(message)
          ::Chat::InboxBroadcastService.message_payload(message)
        end

        def serialize_activity(activity)
          {
            id: activity.id,
            type: activity.activity_type,
            old_status: activity.old_status,
            new_status: activity.new_status,
            performed_by_id: activity.performed_by_id,
            created_at: activity.created_at
          }
        end

        def latest_messages_for(session_ids)
          return {} if session_ids.empty?

          latest_ids = ChatMessage
                       .where(chat_session_id: session_ids)
                       .select('DISTINCT ON (chat_session_id) id')
                       .order(:chat_session_id, created_at: :desc)
          ChatMessage.includes(:sender).where(id: latest_ids).index_by(&:chat_session_id)
        end
      end
    end
  end
end
