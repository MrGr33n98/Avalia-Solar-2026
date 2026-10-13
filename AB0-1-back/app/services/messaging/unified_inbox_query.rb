# frozen_string_literal: true

module Messaging
  class UnifiedInboxQuery
    class << self
      def call(user:, params: {})
        company_id = resolve_company_id(user: user, requested_id: params[:company_id])
        validate_access!(user: user, company_id: company_id) if company_id.present?

        channel = params[:channel].presence || 'all' # 'all', 'p2p', 'ai'
        filter = params[:filter].presence || 'all'   # 'all', 'unread', 'waiting_reply', 'archived'
        query_text = params[:q].to_s.strip
        limit = [[params.fetch(:limit, 30).to_i, 1].max, 100].min

        company = company_id.present? ? ::Company.find_by(id: company_id) : nil
        channels_status = check_channels_status(company: company)

        p2p_items = []
        ai_items = []

        # 1. Query P2P Channel
        if (channel == 'all' || channel == 'p2p') && channels_status.dig(:p2p, :enabled)
          p2p_scope = build_p2p_scope(user: user, company_id: company_id, filter: filter, q: query_text, cursor: params[:cursor])
          records = p2p_scope.limit(limit + 1)
          p2p_items = records.map { |conv| P2pInboxAdapter.adapt(conv, viewer: user) }
        end

        # 2. Query AI Channel
        if (channel == 'all' || channel == 'ai') && company.present? && channels_status.dig(:ai, :enabled)
          ai_scope = build_ai_scope(company_id: company_id, filter: filter, q: query_text, cursor: params[:cursor])
          records = ai_scope.limit(limit + 1)
          ai_items = records.map { |session| AiInboxAdapter.adapt(session) }
        end

        # 3. Combine & Stable Sort
        combined = (p2p_items + ai_items).sort_by do |item|
          [parse_time(item[:updated_at]), item[:id].to_s]
        end.reverse

        # If a cursor was provided and we have items from multiple channels, apply cursor filter to combined list
        if params[:cursor].present?
          cursor_time = parse_time(params[:cursor])
          if cursor_time
            combined = combined.select do |item|
              t = parse_time(item[:updated_at])
              t && t < cursor_time
            end
          end
        end

        has_next_page = combined.size > limit
        sliced_items = combined.first(limit)
        next_cursor = has_next_page && sliced_items.last ? sliced_items.last[:updated_at] : nil

        # 4. Aggregate Tab Counts
        counts = calculate_counts(user: user, company_id: company_id, channels_status: channels_status)

        {
          items: sliced_items,
          counts: counts,
          channels_status: channels_status,
          pagination: {
            limit: limit,
            has_next_page: has_next_page,
            next_cursor: next_cursor
          }
        }
      end

      def total_unread_count(user:, company_id: nil)
        effective_company_id = resolve_company_id(user: user, requested_id: company_id)
        validate_access!(user: user, company_id: effective_company_id) if effective_company_id.present?

        p2p_unread = if effective_company_id.present?
                       ::Conversation.where(company_id: effective_company_id).sum(:company_unread_count)
                     elsif user.company_user?
                       companies = user.active_member_companies
                       companies = ::Company.where(id: user.company_id) if companies.blank? && user.company_id.present?
                       ::Conversation.where(company_id: companies.select(:id)).sum(:company_unread_count)
                     else
                       user.conversations.sum(:user_unread_count)
                     end

        ai_unread = if effective_company_id.present?
                      ::ChatSession.where(company_id: effective_company_id).where('company_unread_count > 0').sum(:company_unread_count)
                    elsif user.company_user?
                      first_id = user.company_id || user.active_member_companies.first&.id
                      first_id ? ::ChatSession.where(company_id: first_id).where('company_unread_count > 0').sum(:company_unread_count) : 0
                    else
                      0
                    end

        p2p_unread.to_i + ai_unread.to_i
      end

      private

      def resolve_company_id(user:, requested_id:)
        return requested_id.to_i if requested_id.present?
        return user.company_id if user.company_id.present?
        return user.active_member_companies.first&.id if user.company_user?

        nil
      end

      def validate_access!(user:, company_id:)
        return true if user.admin?
        return true if user.active_membership_for?(company_id)

        raise Pundit::NotAuthorizedError, "Acesso negado à empresa ##{company_id}"
      end

      def check_channels_status(company:)
        p2p_status = { enabled: true }
        ai_status = if company.nil?
                      { enabled: false, reason: 'no_company' }
                    elsif defined?(EntitlementService)
                      explanation = EntitlementService.explain(company: company, feature: 'ai_live_inbox')
                      { enabled: explanation[:allowed], reason: explanation[:reason] }
                    else
                      { enabled: true }
                    end

        { p2p: p2p_status, ai: ai_status }
      end

      def build_p2p_scope(user:, company_id:, filter:, q:, cursor:)
        scope = if company_id.present?
                  ::Conversation.where(company_id: company_id)
                                .includes(:user, :company, :linked_marketplace_proposals, :marketplace_proposal, :direct_messages)
                else
                  user.conversations
                      .includes(:company, :linked_marketplace_proposals, :marketplace_proposal, :direct_messages)
                end

        is_company = company_id.present? || user.admin?

        case filter
        when 'unread'
          scope = is_company ? scope.where('company_unread_count > 0') : scope.where('user_unread_count > 0')
        when 'waiting_reply'
          scope = is_company ? scope.where(status: %w[pending_company open]) : scope.where(status: 'pending_user')
        when 'archived'
          scope = scope.where(status: %w[resolved blocked])
        else # 'all'
          scope = scope.where.not(status: %w[resolved blocked])
        end

        if q.present?
          term = "%#{ActiveRecord::Base.sanitize_sql_like(q)}%"
          scope = if is_company
                    scope.joins(:user).where('users.name ILIKE :term OR users.email ILIKE :term', term: term)
                  else
                    scope.joins(:company).where('companies.name ILIKE :term', term: term)
                  end
        end

        if cursor.present?
          cursor_time = parse_time(cursor)
          scope = scope.where('COALESCE(conversations.last_message_at, conversations.created_at) < ?', cursor_time) if cursor_time
        end

        scope.ordered_for_inbox
      end

      def build_ai_scope(company_id:, filter:, q:, cursor:)
        scope = ::ChatSession.for_inbox
                             .where(company_id: company_id)
                             .includes(:chat_lead, :user, :assigned_agent, :chat_messages)

        case filter
        when 'unread'
          scope = scope.where('company_unread_count > 0')
        when 'waiting_reply'
          scope = scope.where(inbox_status: 'waiting_agent')
        when 'archived'
          scope = scope.where(inbox_status: 'archived')
        else # 'all'
          scope = scope.where.not(inbox_status: 'archived')
        end

        if q.present?
          term = "%#{ActiveRecord::Base.sanitize_sql_like(q)}%"
          scope = scope.left_joins(:chat_lead).where(
            'chat_leads.name ILIKE :term OR chat_leads.email ILIKE :term OR chat_leads.phone ILIKE :term OR chat_leads.city ILIKE :term',
            term: term
          )
        end

        if cursor.present?
          cursor_time = parse_time(cursor)
          scope = scope.where('COALESCE(chat_sessions.last_message_at, chat_sessions.created_at) < ?', cursor_time) if cursor_time
        end

        scope.inbox_recent
      end

      def calculate_counts(user:, company_id:, channels_status:)
        is_company = company_id.present? || user.admin?

        p2p_base = if company_id.present?
                     ::Conversation.where(company_id: company_id)
                   elsif user.company_user?
                     companies = user.active_member_companies
                     companies = ::Company.where(id: user.company_id) if companies.blank? && user.company_id.present?
                     ::Conversation.where(company_id: companies.select(:id))
                   else
                     user.conversations
                   end

        p2p_unread = is_company ? p2p_base.where('company_unread_count > 0').count : p2p_base.where('user_unread_count > 0').count
        p2p_waiting = is_company ? p2p_base.where(status: %w[pending_company open]).count : p2p_base.where(status: 'pending_user').count
        p2p_archived = p2p_base.where(status: %w[resolved blocked]).count
        p2p_all = p2p_base.where.not(status: %w[resolved blocked]).count

        ai_unread = 0
        ai_waiting = 0
        ai_archived = 0
        ai_all = 0

        if company_id.present? && channels_status.dig(:ai, :enabled)
          ai_base = ::ChatSession.where(company_id: company_id)
          ai_unread = ai_base.where('company_unread_count > 0').count
          ai_waiting = ai_base.where(inbox_status: 'waiting_agent').count
          ai_archived = ai_base.where(inbox_status: 'archived').count
          ai_all = ai_base.where.not(inbox_status: 'archived').count
        end

        {
          all: p2p_all + ai_all,
          unread: p2p_unread + ai_unread,
          waiting_reply: p2p_waiting + ai_waiting,
          archived: p2p_archived + ai_archived
        }
      end

      def parse_time(val)
        return nil if val.blank?

        val.is_a?(Time) || val.is_a?(DateTime) ? val : (Time.zone.parse(val.to_s) rescue nil)
      end
    end
  end
end
