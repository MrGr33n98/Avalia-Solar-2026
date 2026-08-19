# frozen_string_literal: true

module Messaging
  class UnifiedInboxQuery
    class << self
      def call(user:, params: {})
        channel = params[:channel].presence || 'all' # 'all', 'p2p', 'ai'
        limit = [params.fetch(:limit, 30).to_i, 100].min

        p2p_items = []
        ai_items = []

        if channel == 'all' || channel == 'p2p'
          p2p_scope = if user.company_user?
                        companies = user.active_member_companies
                        companies = ::Company.where(id: user.company&.id) if companies.blank? && user.company.present?
                        ::Conversation.where(company_id: companies.select(:id)).includes(:user, :company, :direct_messages)
                      else
                        user.conversations.includes(:company, :direct_messages)
                      end.ordered_for_inbox.limit(limit)

          p2p_items = p2p_scope.map { |conv| P2pInboxAdapter.adapt(conv, viewer: user) }
        end

        if (channel == 'all' || channel == 'ai') && user.company_user?
          company_id = user.company&.id || user.active_member_companies.first&.id
          if company_id
            ai_scope = ::ChatSession.for_inbox.where(company_id: company_id).inbox_recent.limit(limit)
            ai_items = ai_scope.map { |session| AiInboxAdapter.adapt(session) }
          end
        end

        combined = (p2p_items + ai_items).sort_by do |item|
          Time.zone.parse(item[:updated_at]) rescue Time.zone.now
        end.reverse

        if params[:cursor].present?
          cursor_time = Time.zone.parse(params[:cursor]) rescue nil
          if cursor_time
            combined = combined.select do |item|
              t = Time.zone.parse(item[:updated_at]) rescue nil
              t && t < cursor_time
            end
          end
        end

        has_next_page = combined.size > limit
        sliced_items = combined.first(limit)

        next_cursor = if has_next_page && sliced_items.last
                        sliced_items.last[:updated_at]
                      end

        {
          items: sliced_items,
          pagination: {
            limit: limit,
            has_next_page: has_next_page,
            next_cursor: next_cursor
          }
        }
      end

      def total_unread_count(user:)
        p2p_unread = if user.company_user?
                       companies = user.active_member_companies
                       companies = ::Company.where(id: user.company&.id) if companies.blank? && user.company.present?
                       ::Conversation.where(company_id: companies.select(:id)).sum(:company_unread_count)
                     else
                       user.conversations.sum(:user_unread_count)
                     end

        ai_unread = if user.company_user?
                      company_id = user.company&.id || user.active_member_companies.first&.id
                      company_id ? ::ChatSession.for_inbox.where(company_id: company_id, unread_by_company: true).count : 0
                    else
                      0
                    end

        p2p_unread.to_i + ai_unread.to_i
      end
    end
  end
end
