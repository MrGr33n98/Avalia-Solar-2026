module Api
  module V1
    class ConversationsController < BaseController
      include FeatureGateEnforceable

      before_action :authenticate_user!

      def index
        @conversations = if current_user.company_user? && current_user.company_id
                           current_user.company.conversations.includes(:user)
                         else
                           current_user.conversations.includes(:company)
                         end

        render json: @conversations.map { |conv| conversation_json(conv) }
      end

      def create
        company = Company.find_by(id: params[:company_id])
        return render json: { error: 'Company not found' }, status: :not_found unless company
        return render json: { error: 'Chat is disabled for this company' }, status: :forbidden unless company.p2p_chat_enabled
        enforce_feature_access!(:p2p_chat, company: company)
        return if performed?

        @conversation = Conversation.find_or_create_by(user_id: current_user.id, company_id: company.id)
        
        render json: conversation_json(@conversation)
      end

      private

      def conversation_json(conversation)
        {
          id: conversation.id,
          user_id: conversation.user_id,
          company_id: conversation.company_id,
          created_at: conversation.created_at,
          user_name: conversation.user&.name,
          company_name: conversation.company&.name,
          company_logo: conversation.company&.logo&.attached? ? url_for(conversation.company.logo) : nil,
          company_avatar: conversation.company&.logo&.attached? ? url_for(conversation.company.logo) : nil,
          last_message: conversation.direct_messages.order(created_at: :desc).first&.body
        }
      end
    end
  end
end
