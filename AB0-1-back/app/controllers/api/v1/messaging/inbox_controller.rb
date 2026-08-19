# frozen_string_literal: true

module Api
  module V1
    module Messaging
      class InboxController < BaseController
        before_action :authenticate_api_user

        def index
          result = ::Messaging::UnifiedInboxQuery.call(user: current_user, params: params)
          render json: result
        end

        def unread_count
          total = ::Messaging::UnifiedInboxQuery.total_unread_count(user: current_user)
          render json: { unread_count: total }
        end
      end
    end
  end
end
