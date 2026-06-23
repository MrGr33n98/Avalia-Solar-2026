module Api
  module V1
    class DirectMessagesController < BaseController
      include FeatureGateEnforceable

      before_action :authenticate_api_user
      before_action :set_conversation

      def index
        mark_messages_as_read!
        @messages = @conversation.direct_messages.order(created_at: :asc)
        render json: @messages.map { |msg| message_json(msg) }
      end

      def create
        unless @conversation.company.p2p_chat_enabled
          return render json: { error: 'Chat is disabled for this company' }, status: :forbidden
        end

        enforce_feature_access!(:p2p_chat, company: @conversation.company)
        return if performed?

        sender_type = current_user.company_user? ? 'Company' : 'User'
        @message = @conversation.direct_messages.build(
          body: params[:body],
          sender_type: sender_type
        )

        if @message.save
          broadcast_message(@message)
          render json: message_json(@message), status: :created
        else
          render json: { errors: @message.errors.full_messages }, status: :unprocessable_entity
        end
      end

      private

      def set_conversation
        @conversation = Conversation.find_by(id: params[:conversation_id])
        return render json: { error: 'Conversation not found' }, status: :not_found unless @conversation
        
        unless can_access_conversation?
          render json: { error: 'Unauthorized' }, status: :forbidden
        end
      end

      def can_access_conversation?
        return true if current_user.id == @conversation.user_id
        return true if current_user.company_user? && current_user.active_membership_for?(@conversation.company_id)
        return true if current_user.admin?

        false
      end

      def message_json(message)
        {
          id: message.id,
          body: message.body,
          sender_type: message.sender_type,
          created_at: message.created_at,
          read_at: message.read_at
        }
      end

      def viewer_sender_type
        if current_user.company_user? && current_user.active_membership_for?(@conversation.company_id)
          'Company'
        else
          'User'
        end
      end

      def mark_messages_as_read!
        unread_sender_type = viewer_sender_type == 'Company' ? 'User' : 'Company'

        @conversation
          .direct_messages
          .where(sender_type: unread_sender_type, read_at: nil)
          .update_all(read_at: Time.current, updated_at: Time.current)
      end

      def broadcast_message(message)
        ActionCable.server.broadcast(
          "conversation:#{@conversation.id}",
          message_json(message)
        )
      end
    end
  end
end
