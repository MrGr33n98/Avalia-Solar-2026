module Api
  module V1
    class ConversationsController < BaseController
      include FeatureGateEnforceable

      before_action :authenticate_api_user
      before_action :set_conversation, only: %i[read resolve reopen block report events]

      def index
        scope = if current_user.company_user?
                  company_conversations_scope
                else
                  current_user.conversations.includes(:company, :direct_messages)
                end

        scope = scope.ordered_for_inbox

        if params[:cursor].present?
          cursor_time = Time.zone.parse(params[:cursor]) rescue nil
          scope = scope.where('COALESCE(conversations.last_message_at, conversations.created_at) < ?', cursor_time) if cursor_time
        end

        limit = params[:limit].present? ? [params[:limit].to_i, 100].min : nil
        scope = scope.limit(limit) if limit

        conversations = scope.to_a
        items = conversations.map { |conv| conversation_json(conv) }

        if params[:paginated] == 'true' || params[:cursor].present?
          has_next_page = limit ? conversations.size == limit : false
          next_cursor = conversations.last ? (conversations.last.last_message_at || conversations.last.created_at)&.iso8601(6) : nil

          render json: {
            conversations: items,
            pagination: {
              limit: limit || items.size,
              has_next_page: has_next_page,
              next_cursor: next_cursor
            }
          }
        else
          render json: items
        end
      end

      def unread_count
        unread = if current_user.company_user?
                   company_conversations_scope.sum(:company_unread_count)
                 else
                   current_user.conversations.sum(:user_unread_count)
                 end

        render json: { unread_count: unread.to_i }
      end

      def create
        unless current_user.review_user?
          return render json: { error: 'Only buyer users can start direct chats' },
                        status: :forbidden
        end

        company = ::Company.find_by(id: params[:company_id])
        return render json: { error: 'Company not found' }, status: :not_found unless company

        unless company.p2p_chat_enabled
          return render json: { error: 'Chat is disabled for this company' },
                        status: :forbidden
        end

        enforce_feature_access!(:p2p_chat, company: company)
        return if performed?

        @conversation = ::Conversation.find_or_initialize_by(user_id: current_user.id, company_id: company.id)

        if @conversation.new_record?
          @conversation.save!
          @conversation.create_event!('conversation.started', actor: current_user)
          P2pChat::Broadcaster.conversation_updated(@conversation)
        end

        render json: conversation_json(@conversation)
      end

      def read
        message_ids = @conversation.mark_read_for!(current_user)
        P2pChat::Broadcaster.message_read(
          @conversation,
          reader: current_user,
          read_at: Time.current,
          message_ids: message_ids
        )

        render json: conversation_json(@conversation.reload)
      end

      def resolve
        unless company_actor?
          return render json: { error: 'Only company users can resolve conversations' },
                        status: :forbidden
        end

        @conversation.resolve!(actor: current_user)
        P2pChat::Broadcaster.conversation_updated(@conversation)
        render json: conversation_json(@conversation)
      end

      def reopen
        @conversation.reopen!(actor: current_user)
        P2pChat::Broadcaster.conversation_updated(@conversation)
        render json: conversation_json(@conversation)
      end

      def block
        @conversation.block!(actor: current_user, reason: params[:reason])
        P2pChat::Broadcaster.conversation_blocked(@conversation)
        render json: conversation_json(@conversation)
      end

      def report
        report = @conversation.report!(
          actor: current_user,
          reason: params[:reason],
          details: params[:details]
        )
        P2pChat::Broadcaster.conversation_reported(@conversation, report)
        render json: {
          success: true,
          report_id: report.id,
          conversation: conversation_json(@conversation.reload)
        }, status: :created
      end

      def events
        events = @conversation.conversation_events.includes(:actor).order(created_at: :desc).limit(100)
        render json: events.map { |event| P2pChat::Serializer.event(event) }
      end

      private

      def set_conversation
        @conversation = ::Conversation.find_by(id: params[:id])
        return render json: { error: 'Conversation not found' }, status: :not_found unless @conversation

        render json: { error: 'Unauthorized' }, status: :forbidden unless @conversation.accessible_by?(current_user)
      end

      def company_conversations_scope
        companies = current_user.active_member_companies
        companies = ::Company.where(id: current_user.company&.id) if companies.blank? && current_user.company.present?

        ::Conversation.where(company_id: companies.select(:id)).includes(:user, :company, :direct_messages)
      end

      def conversation_json(conversation)
        P2pChat::Serializer.conversation(conversation, viewer: current_user)
      end

      def company_actor?
        current_user.admin? || (current_user.company_user? && current_user.active_membership_for?(@conversation.company_id))
      end
    end
  end
end
