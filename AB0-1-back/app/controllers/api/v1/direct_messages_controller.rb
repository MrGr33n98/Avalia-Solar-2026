module Api
  module V1
    class DirectMessagesController < BaseController
      include FeatureGateEnforceable
      require 'base64'
      require 'stringio'

      before_action :authenticate_api_user
      before_action :set_conversation

      def index
        message_ids = @conversation.mark_read_for!(current_user)
        P2pChat::Broadcaster.message_read(
          @conversation,
          reader: current_user,
          read_at: Time.current,
          message_ids: message_ids
        ) if message_ids.any?

        @messages = @conversation.direct_messages.order(created_at: :asc)
        render json: @messages.map { |msg| message_json(msg) }
      end

      def create
        unless @conversation.company.p2p_chat_enabled
          return render json: { error: 'Chat is disabled for this company' }, status: :forbidden
        end

        return render json: { error: 'Conversation is blocked' }, status: :forbidden if @conversation.blocked?

        enforce_feature_access!(:p2p_chat, company: @conversation.company)
        return if performed?

        sender_type = @conversation.viewer_role_for(current_user)
        return render json: { error: 'Unauthorized' }, status: :forbidden unless sender_type

        if params[:client_message_id].present?
          existing_message = @conversation.direct_messages.find_by(client_message_id: params[:client_message_id])
          return render json: message_json(existing_message), status: :ok if existing_message
        end

        @message = @conversation.direct_messages.build(
          body: params[:body],
          sender_type: sender_type,
          sender: current_user,
          client_message_id: params[:client_message_id],
          metadata: {
            client: params[:client],
            attachment_count: attachment_payloads.size
          }.compact
        )
        attach_payloads_to(@message)

        if @message.save
          @conversation.register_message!(@message, actor: current_user)
          P2pChat::Broadcaster.message_created(@message)
          render json: message_json(@message), status: :created
        else
          render json: { errors: @message.errors.full_messages }, status: :unprocessable_entity
        end
      end

      private

      def set_conversation
        @conversation = ::Conversation.find_by(id: params[:conversation_id])
        return render json: { error: 'Conversation not found' }, status: :not_found unless @conversation
        
        unless can_access_conversation?
          render json: { error: 'Unauthorized' }, status: :forbidden
        end
      end

      def can_access_conversation?
        @conversation.accessible_by?(current_user)
      end

      def message_json(message)
        P2pChat::Serializer.message(message)
      end

      def attachment_payloads
        @attachment_payloads ||= begin
          raw = params[:attachments].presence || params[:attachment].presence
          Array.wrap(raw).filter_map { |payload| normalize_attachment_payload(payload) }
        end
      end

      def attach_payloads_to(message)
        attachment_payloads.each { |payload| message.attachments.attach(payload) }
      end

      def normalize_attachment_payload(payload)
        payload = payload.to_unsafe_h if payload.respond_to?(:to_unsafe_h)

        if payload.is_a?(String)
          build_attachment(payload, nil, nil)
        elsif payload.is_a?(Hash)
          build_attachment(
            payload[:data] || payload['data'] || payload[:base64] || payload['base64'],
            payload[:filename] || payload['filename'],
            payload[:content_type] || payload['content_type']
          )
        end
      end

      def build_attachment(data, filename, content_type)
        return nil if data.blank?

        parsed_content_type = data[%r{\Adata:([^;]+);base64,}, 1]
        base64 = data.sub(%r{\Adata:[^;]+;base64,}, '')
        final_content_type = content_type.presence || parsed_content_type || 'application/octet-stream'
        final_filename = filename.presence || "anexo-#{SecureRandom.hex(4)}#{extension_for(final_content_type)}"

        {
          io: StringIO.new(Base64.decode64(base64)),
          filename: final_filename,
          content_type: final_content_type
        }
      rescue ArgumentError
        nil
      end

      def extension_for(content_type)
        case content_type
        when 'image/jpeg' then '.jpg'
        when 'image/png' then '.png'
        when 'image/webp' then '.webp'
        when 'application/pdf' then '.pdf'
        else '.bin'
        end
      end
    end
  end
end
