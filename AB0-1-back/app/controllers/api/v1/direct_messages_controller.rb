module Api
  module V1
    class DirectMessagesController < BaseController
      before_action :authenticate_user!
      before_action :set_conversation

      def index
        @messages = @conversation.direct_messages.order(created_at: :asc)
        render json: @messages.map { |msg| message_json(msg) }
      end

      def create
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
        return true if current_user.company_user? && current_user.company_id == @conversation.company_id
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

      def broadcast_message(message)
        ActionCable.server.broadcast(
          "conversation:#{@conversation.id}",
          message_json(message)
        )
      end
    end
  end
end
