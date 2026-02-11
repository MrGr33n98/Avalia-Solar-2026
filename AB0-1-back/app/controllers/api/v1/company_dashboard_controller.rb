# app/controllers/api/v1/company_dashboard_controller.rb
module Api
  module V1
    class CompanyDashboardController < BaseController
      before_action :authenticate_company_user_or_admin!
      before_action :set_company

      # GET /api/v1/company_dashboard/stats
      def stats
        stats_service = CompanyDashboard::StatsService.new(@company)
        
        render json: {
          stats: stats_service.call,
          plan_features: @company.effective_plan_features || {}
        }, status: :ok
      rescue => e
        Rails.logger.error("Company dashboard stats error: #{e.message}")
        render json: {
          stats: CompanyDashboard::StatsService.new(nil).call,
          plan_features: {}
        }, status: :ok
      end

      # GET /api/v1/company_dashboard/banner_subscriptions
      def banner_subscriptions
        subs = @company.banner_subscriptions.includes(:banner_offer).order(created_at: :desc)
        render json: {
          subscriptions: subs.as_json(include: { banner_offer: { only: %i[id name price_cents currency duration_days rules_json active] } })
        }
      end

      # POST /api/v1/company_dashboard/banner_checkout
      def banner_checkout
        offer = BannerOffer.find(params[:offer_id])

        checkout_session_id = SecureRandom.uuid
        sub = @company.banner_subscriptions.create!(
          banner_offer: offer,
          status: 'pending_payment',
          provider: 'mock',
          checkout_session_id: checkout_session_id
        )

        render json: {
          subscription: sub.as_json(only: %i[id status provider checkout_session_id created_at]),
          message: 'Checkout criado. Confirme o pagamento via webhook (ambiente mock).',
          webhook_example: {
            url: '/api/v1/payments/webhooks/mock',
            payload: { checkout_session_id: checkout_session_id, status: 'paid' }
          }
        }, status: :created
      rescue ActiveRecord::RecordNotFound
        render json: { error: 'offer_not_found' }, status: :not_found
      end

      # POST /api/v1/company_dashboard/update_info
      def update_info
        if current_user&.role == 'admin'
          if @company.update(company_params)
            return render json: { message: 'AlteraÃ§Ãµes aplicadas com sucesso' }, status: :ok
          else
            return render json: { errors: @company.errors }, status: :unprocessable_entity
          end
        end

        direct_update_keys = %w[project_types services_offered]
        direct_update_attrs = company_params.slice(*direct_update_keys)
        if direct_update_attrs.present?
          @company.update(direct_update_attrs)
        end

        pending_change = @company.pending_changes.create!(
      change_type: 'company_info',
      data: {
        attributes: company_params,
        previous_values: @company.attributes.slice(*company_params.keys)
      },
      user_id: current_user&.id,
      status: 'pending'
    )

    Analytics::TrackEventService.call(
      company_id: @company.id,
      event_type: 'dashboard_update_requested',
      user: current_user,
      metadata: request_metadata.merge(
        change_type: 'company_info',
        pending_change_id: pending_change.id
      )
    )

    render json: {
          message: direct_update_attrs.present? ? 'AlteraÃ§Ãµes aplicadas e enviadas para aprovaÃ§Ã£o' : 'AlteraÃ§Ãµes enviadas para aprovaÃ§Ã£o',
          pending_change: pending_change
        }, status: :created
      end

      # POST /api/v1/company_dashboard/add_categories
      def add_categories
        pending_change = @company.pending_changes.create!(
      change_type: 'categories',
      data: {
        action: 'add',
        category_ids: params[:category_ids]
      },
      user_id: current_user&.id,
      status: 'pending'
    )

    Analytics::TrackEventService.call(
      company_id: @company.id,
      event_type: 'dashboard_update_requested',
      user: current_user,
      metadata: request_metadata.merge(
        change_type: 'categories',
        action: 'add',
        category_ids: params[:category_ids],
        pending_change_id: pending_change.id
      )
    )

    render json: {
          message: 'SolicitaÃ§Ã£o de categorias enviada para aprovaÃ§Ã£o',
          pending_change: pending_change
        }, status: :created
      end

      # POST /api/v1/company_dashboard/remove_category
      def remove_category
        pending_change = @company.pending_changes.create!(
      change_type: 'categories',
      data: {
        action: 'remove',
        category_ids: [params[:category_id]]
      },
      user_id: current_user&.id,
      status: 'pending'
    )

    Analytics::TrackEventService.call(
      company_id: @company.id,
      event_type: 'dashboard_update_requested',
      user: current_user,
      metadata: request_metadata.merge(
        change_type: 'categories',
        action: 'remove',
        category_id: params[:category_id],
        pending_change_id: pending_change.id
      )
    )

    render json: {
          message: 'SolicitaÃ§Ã£o de remoÃ§Ã£o enviada para aprovaÃ§Ã£o',
          pending_change: pending_change
        }, status: :created
      end

      # POST /api/v1/company_dashboard/update_ctas
      def update_ctas
        pending_change = @company.pending_changes.create!(
      change_type: 'cta_config',
      data: cta_params,
      user_id: current_user&.id,
      status: 'pending'
    )

    Analytics::TrackEventService.call(
      company_id: @company.id,
      event_type: 'dashboard_update_requested',
      user: current_user,
      metadata: request_metadata.merge(
        change_type: 'cta_config',
        pending_change_id: pending_change.id
      )
    )

    render json: {
          message: 'ConfiguraÃ§Ãµes de CTAs enviadas para aprovaÃ§Ã£o',
          pending_change: pending_change
        }, status: :created
      end

      # POST /api/v1/company_dashboard/update_logo
      def update_logo
        file = params[:file]
        return render json: { error: 'Arquivo ausente' }, status: :unprocessable_entity if file.blank?

        unless %w[image/png image/jpeg].include?(file.content_type)
          return render json: { error: 'Formato invÃ¡lido. Use PNG ou JPG' }, status: :unprocessable_entity
        end
        if file.size.to_i > 2.megabytes
          return render json: { error: 'Logo acima de 2MB' }, status: :unprocessable_entity
        end

        blob = ActiveStorage::Blob.create_and_upload!(io: file, filename: file.original_filename, content_type: file.content_type)

        pending_change = @company.pending_changes.create!(
      change_type: 'logo',
      data: { signed_id: blob.signed_id },
      user_id: current_user&.id,
      status: 'pending'
    )

    Analytics::TrackEventService.call(
      company_id: @company.id,
      event_type: 'dashboard_update_requested',
      user: current_user,
      metadata: request_metadata.merge(
        change_type: 'logo',
        pending_change_id: pending_change.id
      )
    )

    render json: { message: 'Logo enviada para aprovaÃ§Ã£o', pending_change: pending_change }, status: :created
      end

      # POST /api/v1/company_dashboard/update_banner
      def update_banner
        file = params[:file]
        return render json: { error: 'Arquivo ausente' }, status: :unprocessable_entity if file.blank?

        unless %w[image/png image/jpeg].include?(file.content_type)
          return render json: { error: 'Formato invÃ¡lido. Use PNG ou JPG' }, status: :unprocessable_entity
        end
        if file.size.to_i > 5.megabytes
          return render json: { error: 'Banner acima de 5MB' }, status: :unprocessable_entity
        end

        blob = ActiveStorage::Blob.create_and_upload!(io: file, filename: file.original_filename, content_type: file.content_type)
        begin
          blob.analyze
          meta = blob.metadata || {}
          w, h = meta['width'], meta['height']
          if w && h && (w < 1920 || h < 600)
            return render json: { error: 'DimensÃµes mÃ­nimas recomendadas: 1920x600px' }, status: :unprocessable_entity
          end
        rescue => e
          Rails.logger.warn "Falha ao analisar dimensÃµes do banner: #{e.message}"
        end

        pending_change = @company.pending_changes.create!(
      change_type: 'banner',
      data: { signed_id: blob.signed_id },
      user_id: current_user&.id,
      status: 'pending'
    )

    Analytics::TrackEventService.call(
      company_id: @company.id,
      event_type: 'dashboard_update_requested',
      user: current_user,
      metadata: request_metadata.merge(
        change_type: 'banner',
        pending_change_id: pending_change.id
      )
    )

    render json: { message: 'Banner enviado para aprovaÃ§Ã£o', pending_change: pending_change }, status: :created
      end

      # GET /api/v1/company_dashboard/pending_changes
      def pending_changes
        changes = @company.pending_changes.pending.order(created_at: :desc)
        render json: {
          pending_changes: changes.as_json(
            include: { user: { only: [:id, :name, :email] } }
          )
        }
      end

      # GET /api/v1/company_dashboard/notifications
      def notifications
        # Fetch notifications for the company
        notifications = []

        # Approved changes
        if @company&.pending_changes&.respond_to?(:approved)
          @company.pending_changes.approved.where('approved_at > ?', 7.days.ago).each do |change|
            notifications << {
              type: 'approval',
              title: 'AlteraÃ§Ã£o Aprovada',
              message: "Sua alteraÃ§Ã£o de #{change.change_type.humanize} foi aprovada",
              timestamp: change.approved_at,
              read: false
            }
          end
        end

        # New reviews
        @company&.reviews&.where('created_at > ?', 7.days.ago)&.each do |review|
          notifications << {
            type: 'review',
            title: 'Nova AvaliaÃ§Ã£o',
            message: "Nova avaliaÃ§Ã£o de #{review.rating} estrelas recebida",
            timestamp: review.created_at,
            read: false
          }
        end

        # New leads
        @company&.leads&.where('created_at > ?', 7.days.ago)&.each do |lead|
          notifications << {
            type: 'lead',
            title: 'Novo Lead',
            message: "Novo contato de #{lead.name}",
            timestamp: lead.created_at,
            read: false
          }
        end

        render json: {
          notifications: notifications.sort_by { |n| n[:timestamp] }.reverse.first(20)
        }
      rescue => e
        Rails.logger.error("Company dashboard notifications error: #{e.message}")
        render json: { notifications: [] }, status: :ok
      end

      # GET /api/v1/company_dashboard/media
      def media
        render json: { photos: @company.media_urls }
      end
      # GET /api/v1/company_dashboard/videos
      def videos
        videos = @company.published_videos.map { |v| { id: v.id, url: v.url, thumbnail_url: v.thumbnail_url, provider: v.provider, video_id: v.video_id } }
        render json: { videos: videos }
      end

      # POST /api/v1/company_dashboard/upload_media
      def upload_media
        unless current_user&.admin? || current_user&.role == 'company'
          return render json: { error: 'Unauthorized' }, status: :unauthorized
        end

        unless media_upload_permitted?
          return render json: { error: 'Plano necessário para upload de mídia' }, status: :forbidden
        end

        images = params[:images]
        if images.blank?
          return render json: { error: 'Nenhum arquivo enviado' }, status: :unprocessable_entity
        end

        signed_ids = []
        Array(images).each do |io|
          begin
            blob = ActiveStorage::Blob.create_and_upload!(io: io, filename: io.original_filename, content_type: io.content_type)
            signed_ids << blob.signed_id
          rescue => e
            Rails.logger.error "Erro ao criar blob: #{e.message}"
          end
        end

        if signed_ids.empty?
          return render json: { error: 'Falha ao processar arquivos' }, status: :unprocessable_entity
        end

        pending_change = @company.pending_changes.create!(
          change_type: 'media',
          data: { signed_ids: signed_ids },
          user_id: current_user&.id,
          status: 'pending'
        )

        render json: { message: 'MÃ­dia enviada para aprovaÃ§Ã£o', pending_change: pending_change }, status: :created
      end

      # POST /api/v1/company_dashboard/add_video
      def add_video
        unless current_user&.admin? || current_user&.role == 'company'
          return render json: { error: 'Unauthorized' }, status: :unauthorized
        end
        unless media_upload_permitted?
          return render json: { error: 'Plano necessÃ¡rio para adicionar vÃ­deo' }, status: :forbidden
        end
        url = params[:url].to_s
        result = Videos::YouTubeExtractor.extract(url)
        return render json: { error: result[:error] }, status: :unprocessable_entity unless result[:valid]

        pending_change = @company.pending_changes.create!(
          change_type: 'video',
          data: {
            url: url,
            provider: result[:provider],
            video_id: result[:video_id],
            thumbnail_url: result[:thumbnail_url],
            action: 'add'
          },
          user_id: current_user.id,
          status: 'pending'
        )
        render json: { message: 'VÃ­deo enviado para aprovaÃ§Ã£o', pending_change: pending_change }, status: :created
      end

      # DELETE /api/v1/company_dashboard/remove_video
      def remove_video
        unless current_user&.admin? || current_user&.role == 'company'
          return render json: { error: 'Unauthorized' }, status: :unauthorized
        end
        unless media_upload_permitted?
          return render json: { error: 'Plano necessÃ¡rio para gerenciar vÃ­deos' }, status: :forbidden
        end
        vid = params[:video_id].to_s.presence || params[:id].to_s
        if vid.blank?
          return render json: { error: 'ParÃ¢metro video_id ausente' }, status: :unprocessable_entity
        end
        pending_change = @company.pending_changes.create!(
          change_type: 'video',
          data: { video_id: vid, action: 'remove' },
          user_id: current_user.id,
          status: 'pending'
        )
        render json: { message: 'RemoÃ§Ã£o de vÃ­deo enviada para aprovaÃ§Ã£o', pending_change: pending_change }, status: :created
      end

      private

      def set_company
        @company =
          if current_user&.admin?
            ::Company.find_by(id: params[:company_id] || params[:id] || params.dig(:company, :id))
          else
            selected_company_id = cookies.signed[:active_company_id] || current_user&.company_id
            if selected_company_id.present? && current_user&.active_membership_for?(selected_company_id)
              ::Company.find_by(id: selected_company_id)
            else
              current_user&.active_member_companies&.first
            end
          end

        unless @company
          render json: { error: 'Company not found' }, status: :not_found and return
        end
      end

      def authenticate_company_user_or_admin!
        return if current_user&.admin?
        authenticate_company_user!
      end

      def authenticate_company_user!
        unless current_user&.active_member_companies&.any?
          return render json: { error: 'Unauthorized' }, status: :unauthorized
        end
        unless current_user&.active?
          return render json: { error: 'Access pending approval' }, status: :forbidden
        end
      end

      def media_upload_permitted?
        return true if current_user&.admin?
        return false unless @company

        @company.media_upload_allowed?
      end

      def company_params
        params.require(:company).permit(
          :name, :description, :website, :phone, :phone_alt, :whatsapp,
          :email_public, :address, :state, :city, :cnpj,
          :instagram, :facebook, :linkedin, :working_hours,
          :payment_methods, :certifications, :awards,
          :founded_year, :employees_count, :latitude, :longitude,
          :minimum_ticket, :maximum_ticket, :financing_options,
          :response_time_sla, :languages, project_types: [], services_offered: []
        )
      end

      def cta_params
        params.permit(
          :cta_primary_label, :cta_primary_url,
          :cta_secondary_label, :cta_secondary_url,
          :cta_whatsapp_template,
          :cta_utm_source, :cta_utm_medium, :cta_utm_campaign
        )
      end

      def calculate_conversion_rate
        # Now handled by CompanyDashboard::StatsService
      end
    end
  end
end


