# frozen_string_literal: true

module Api
  module V1
    class NotificationsController < BaseController
      before_action :authenticate_api_user

      # GET /api/v1/notifications
      def index
        scope = notification_scope.active.recent.includes(:notifiable, :company)

        # Filtro por aba
        case params[:filter].to_s
        when 'unread'
          scope = scope.unread
        when 'quotes'
          scope = scope.by_category('quotes')
        when 'reviews'
          scope = scope.by_category('reviews')
        when 'messages'
          scope = scope.by_category('messages')
        when 'companies'
          scope = scope.by_category('companies')
        when 'system'
          scope = scope.by_category('system')
        end

        notifications = scope.page(params[:page] || 1).per(params[:per_page] || 20)

        render json: {
          data: notifications.map { |n| notification_json(n) },
          meta: {
            total: notification_scope.active.count,
            unread_count: notification_scope.unread.count,
            page: (params[:page] || 1).to_i,
            per_page: (params[:per_page] || 20).to_i,
            counts: filter_counts
          }
        }
      end

      # GET /api/v1/notifications/unread_count
      def unread_count
        render json: { unread_count: notification_scope.unread.count }
      end

      # GET /api/v1/notifications/counts_by_filter
      def counts_by_filter
        render json: { counts: filter_counts }
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

      # POST /api/v1/notifications/:id/archive
      def archive
        notification = current_user.notifications.find(params[:id])
        notification.archive!

        render json: { success: true, notification: notification_json(notification) }
      rescue ActiveRecord::RecordNotFound
        render json: { error: 'Notification not found' }, status: :not_found
      end

      # POST /api/v1/notifications/:id/unarchive
      def unarchive
        notification = current_user.notifications.find(params[:id])
        notification.unarchive!

        render json: { success: true, notification: notification_json(notification) }
      rescue ActiveRecord::RecordNotFound
        render json: { error: 'Notification not found' }, status: :not_found
      end

      private

      def filter_counts
        base = notification_scope.active
        {
          all: base.count,
          unread: base.unread.count,
          quotes: base.by_category('quotes').count,
          reviews: base.by_category('reviews').count,
          messages: base.by_category('messages').count,
          companies: base.by_category('companies').count,
          system: base.by_category('system').count
        }
      end

      def notification_json(n)
        cta_info = resolve_cta(n)
        {
          id: n.id,
          type: n.notification_type,
          category: n.category || 'system',
          title: n.title,
          body: n.message || n.body,
          read: n.read?,
          archived: n.archived?,
          created_at: n.created_at.iso8601,
          cta_label: cta_info[:label],
          destination_url: cta_info[:destination],
          company_name: n.company&.name || n.metadata_json&.dig('company_name'),
          company_logo_url: n.company&.logo_url || n.metadata_json&.dig('company_logo_url'),
          notifiable: notifiable_json(n.notifiable)
        }
      end

      def resolve_cta(n)
        case n.notification_type.to_s
        when /^quote_/
          { label: 'Ver orçamento', destination: "/review-dashboard/quotes/#{n.quote_request_id || n.notifiable_id}" }
        when 'review_replied', 'company_response'
          { label: 'Ver resposta', destination: "/companies/#{n.company&.slug || 'company'}/review/#{n.review_id || n.notifiable_id}" }
        when /^review_/
          { label: 'Ver avaliação', destination: "/companies/#{n.company&.slug || 'company'}/review/#{n.review_id || n.notifiable_id}" }
        when /^new_message/, /^message_/
          { label: 'Abrir conversa', destination: "/review-dashboard/messages?conversation_id=#{n.conversation_id || n.notifiable_id}" }
        when /^favorite_company_/
          { label: 'Ver empresa', destination: "/companies/#{n.company&.slug || n.notifiable_id}" }
        when /^security_/
          { label: 'Revisar atividade', destination: '/review-dashboard/settings/security' }
        else
          { label: 'Ver detalhes', destination: '/review-dashboard' }
        end
      end

      def notification_scope
        ::Notification.where(user_id: current_user.id)
      end

      def notifiable_json(notifiable)
        return nil unless notifiable

        case notifiable
        when Review
          { type: 'Review', id: notifiable.id, company_id: notifiable.company_id }
        when Lead
          { type: 'Lead', id: notifiable.id, company_id: notifiable.company_id }
        when ::Company
          { type: 'Company', id: notifiable.id, name: notifiable.name }
        else
          { type: notifiable.class.name, id: notifiable.id }
        end
      end
    end
  end
end
