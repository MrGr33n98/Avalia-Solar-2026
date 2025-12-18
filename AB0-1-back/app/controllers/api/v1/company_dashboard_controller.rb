# app/controllers/api/v1/company_dashboard_controller.rb
module Api
  module V1
    class CompanyDashboardController < BaseController
      before_action :authenticate_company_user!
      before_action :set_company

      # GET /api/v1/company_dashboard/stats
      def stats
        stats_service = CompanyDashboard::StatsService.new(@company)
        
        render json: {
          stats: stats_service.call,
          plan_features: @company.plan&.features_json || {}
        }, status: :ok
      rescue => e
        Rails.logger.error("Company dashboard stats error: #{e.message}")
        render json: {
          stats: CompanyDashboard::StatsService.new(nil).call,
          plan_features: {}
        }, status: :ok
      end

      # POST /api/v1/company_dashboard/update_info
      def update_info
        if current_user&.role == 'admin'
          if @company.update(company_params)
            return render json: { message: 'Alterações aplicadas com sucesso' }, status: :ok
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

        render json: {
          message: direct_update_attrs.present? ? 'Alterações aplicadas e enviadas para aprovação' : 'Alterações enviadas para aprovação',
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

        render json: {
          message: 'Solicitação de categorias enviada para aprovação',
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

        render json: {
          message: 'Solicitação de remoção enviada para aprovação',
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

        render json: {
          message: 'Configurações de CTAs enviadas para aprovação',
          pending_change: pending_change
        }, status: :created
      end

      # POST /api/v1/company_dashboard/update_logo
      def update_logo
        file = params[:file]
        return render json: { error: 'Arquivo ausente' }, status: :unprocessable_entity if file.blank?

        unless %w[image/png image/jpeg].include?(file.content_type)
          return render json: { error: 'Formato inválido. Use PNG ou JPG' }, status: :unprocessable_entity
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

        render json: { message: 'Logo enviada para aprovação', pending_change: pending_change }, status: :created
      end

      # POST /api/v1/company_dashboard/update_banner
      def update_banner
        file = params[:file]
        return render json: { error: 'Arquivo ausente' }, status: :unprocessable_entity if file.blank?

        unless %w[image/png image/jpeg].include?(file.content_type)
          return render json: { error: 'Formato inválido. Use PNG ou JPG' }, status: :unprocessable_entity
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
            return render json: { error: 'Dimensões mínimas recomendadas: 1920x600px' }, status: :unprocessable_entity
          end
        rescue => e
          Rails.logger.warn "Falha ao analisar dimensões do banner: #{e.message}"
        end

        pending_change = @company.pending_changes.create!(
          change_type: 'banner',
          data: { signed_id: blob.signed_id },
          user_id: current_user&.id,
          status: 'pending'
        )

        render json: { message: 'Banner enviado para aprovação', pending_change: pending_change }, status: :created
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
              title: 'Alteração Aprovada',
              message: "Sua alteração de #{change.change_type.humanize} foi aprovada",
              timestamp: change.approved_at,
              read: false
            }
          end
        end

        # New reviews
        @company&.reviews&.where('created_at > ?', 7.days.ago)&.each do |review|
          notifications << {
            type: 'review',
            title: 'Nova Avaliação',
            message: "Nova avaliação de #{review.rating} estrelas recebida",
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

      # POST /api/v1/company_dashboard/upload_media
      def upload_media
        unless current_user&.role == 'company'
          return render json: { error: 'Unauthorized' }, status: :unauthorized
        end

        unless @company.featured || @company.verified
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

        render json: { message: 'Mídia enviada para aprovação', pending_change: pending_change }, status: :created
      end

      private

      def set_company
        @company = current_user.company
        unless @company
          render json: { error: 'Company not found' }, status: :not_found and return
        end
      end

      def authenticate_company_user!
        unless current_user&.company
          return render json: { error: 'Unauthorized' }, status: :unauthorized
        end
        unless current_user&.active?
          return render json: { error: 'Access pending approval' }, status: :forbidden
        end
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
