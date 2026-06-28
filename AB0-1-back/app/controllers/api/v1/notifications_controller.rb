# frozen_string_literal: true

module Api
  module V1
    class NotificationsController < BaseController
      before_action :authenticate_api_user

      # GET /api/v1/notifications
      def index
        notifications = current_user.notifications
                                    .recent
                                    .includes(:notifiable)
                                    .page(params[:page] || 1)
                                    .per(params[:per_page] || 20)

        render json: {
          data: notifications.map { |n| notification_json(n) },
          meta: {
            total: current_user.notifications.count,
            unread_count: current_user.notifications.unread.count,
            page: params[:page] || 1
          }
        }
      end

      # GET /api/v1/notifications/unread_count
      def unread_count
        count = current_user.notifications.unread.count
        render json: { unread_count: count }
      end

      # POST /api/v1/notifications/:id/mark_as_read
      def mark_as_read
        notification = current_user.notifications.find(params[:id])
        notification.read!

        render json: { success: true, notification: notification_json(notification) }
      rescue ActiveRecord::RecordNotFound
        render json: { error: 'Notification not found' }, status: :not_found
      end

      # POST /api/v1/notifications/mark_all_as_read
      def mark_all_as_read
        count = Notification.mark_all_as_read(current_user)
        render json: { success: true, marked_count: count }
      end

      private

      def notification_json(notification)
        {
          id: notification.id,
          type: notification.notification_type,
          title: notification.title,
          body: notification.body,
          read: notification.read?,
          created_at: notification.created_at.iso8601,
          notifiable: notifiable_json(notification.notifiable)
        }
      end

      def notifiable_json(notifiable)
        return nil unless notifiable

        case notifiable
        when Review
          { type: 'Review', id: notifiable.id, company_id: notifiable.company_id }
        when Lead
          { type: 'Lead', id: notifiable.id, company_id: notifiable.company_id }
        when Company
          { type: 'Company', id: notifiable.id, name: notifiable.name }
        else
          { type: notifiable.class.name, id: notifiable.id }
        end
      end
    end
  end
end
