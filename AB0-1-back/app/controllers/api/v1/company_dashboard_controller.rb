# app/controllers/api/v1/company_dashboard_controller.rb
module Api
  module V1
    class CompanyDashboardController < BaseController
      include PendingChangeIdempotency
      
      before_action :authenticate_company_user_or_admin!
      before_action :set_company
      before_action :authorize_dashboard_access!

      # GET /api/v1/company_dashboard/analytics/overview
      def analytics_overview
        authorize @company, :view_analytics?

        begin
          freshness = ::CompanyDashboard::FreshnessProvider.call
          source = ::CompanyDashboard::MetricsSource.new(company_id: @company.id)
          stats, data_source = source.realtime_totals(
            from_day: 30.days.ago.to_date,
            to_day: Date.current,
            last_aggregated_at: freshness[:last_aggregated_at]
          )

          return render json: default_overview_payload.merge(freshness) unless stats

          views = stats[:profile_views].to_i
          is_premium = @company.has_paid_plan?

          # ✅ NOVO: Build response CONDICIONALMENTE
          response = {
            views_30d: views,
            data_source: data_source
          }

          # SÓ inclui dados premium se tem permissão
          if is_premium && FeatureGateService.can_access?(@company, 'advanced_analytics')
            leads = stats[:leads].to_i
            conversion = views.positive? ? ((leads.to_f / views) * 100).round(2) : 0

            response.merge!(
              cta_clicks_30d: stats[:cta_clicks].to_i,
              whatsapp_clicks_30d: stats[:whatsapp_clicks].to_i,
              email_clicks_30d: stats[:email_clicks].to_i,
              phone_clicks_30d: stats[:phone_clicks].to_i,
              website_clicks_30d: stats[:website_clicks].to_i,
              unique_views_30d: stats[:unique_views].to_i,
              returning_views_30d: stats[:returning_views].to_i,
              leads_30d: leads,
              conversion_rate: conversion,
              is_premium_analytics: true
            )
          else
            # Free users NUNCA recebem essas chaves
            response.merge!(
              is_premium_analytics: false,
              upsell_message: 'Upgrade to Pro to unlock detailed analytics'
            )
          end

          render json: response.merge(freshness)
        rescue StandardError => e
          log_analytics_error('overview', e)
          render json: default_overview_payload.merge(::CompanyDashboard::FreshnessProvider.call)
        end
      end

      # GET /api/v1/company_dashboard/analytics/timeseries
      def analytics_timeseries
        authorize @company, :view_analytics?

        # ✅ FEATURE GATE: Timeseries só para premium
        unless FeatureGateService.can_access?(@company, 'advanced_analytics')
          freshness = ::CompanyDashboard::FreshnessProvider.call
          return render json: {
            data: [],
            data_source: 'feature_not_authorized',
            is_premium_analytics: false,
            upsell_message: 'Upgrade to Pro to view timeseries analytics'
          }.merge(freshness)
        end

        days = [(params[:days] || 90).to_i, 365].min
        freshness = ::CompanyDashboard::FreshnessProvider.call
        source = ::CompanyDashboard::MetricsSource.new(company_id: @company.id)
        series, data_source = source.realtime_timeseries(
          days: days,
          last_aggregated_at: freshness[:last_aggregated_at]
        )

        if data_source == 'company_daily_stats_unavailable'
          return render json: {
            data: [],
            data_source: 'company_daily_stats_unavailable',
            is_premium_analytics: true
          }.merge(freshness)
        end

        data = series.map do |row|
          {
            date: row[:date],
            views: row[:profile_views],
            clicks: row[:cta_clicks],
            whatsapp: row[:whatsapp_clicks],
            leads: row[:leads]
          }
        end

        render json: {
          data: data,
          data_source: data_source,
          is_premium_analytics: true
        }.merge(freshness)
      end

      # GET /api/v1/company_dashboard/analytics/top_campaigns
      def analytics_top_campaigns
        authorize @company, :view_analytics?

        # ✅ FEATURE GATE: Top campaigns só para premium
        unless FeatureGateService.can_access?(@company, 'top_campaigns')
          return render json: {
            campaigns: [],
            is_premium_analytics: false,
            upsell_message: 'Upgrade to Pro to access campaign analytics'
          }, status: :ok
        end

        limit = [[params[:limit].to_i, 1].max, 20].min
        limit = 5 if params[:limit].blank?

        campaigns = ::CompanyUtmAttribution
                    .where(company_id: @company.id)
                    .recent
                    .by_leads
                    .limit(limit)

        render json: {
          campaigns: campaigns.map do |campaign|
            {
              id: campaign.id,
              utm_campaign: campaign.utm_campaign,
              utm_source: campaign.utm_source,
              utm_medium: campaign.utm_medium,
              total_visits: campaign.total_visits,
              total_cta_clicks: campaign.total_cta_clicks,
              total_leads: campaign.total_leads,
              conversion_rate: campaign.conversion_rate.to_f,
              last_seen_at: campaign.last_seen_at
            }
          end,
          is_premium_analytics: true
        }, status: :ok
      rescue StandardError => e
        log_analytics_error('top_campaigns', e)
        render json: { campaigns: [], is_premium_analytics: true }, status: :ok
      end

      # GET /api/v1/company_dashboard/analytics/reputation
      def analytics_reputation
        authorize @company, :view_analytics?

        # ✅ FEATURE GATE: Reputation tracking só para premium
        unless FeatureGateService.can_access?(@company, 'reputation_tracking')
          return render json: {
            total_reviews: 0,
            avg_rating: 0,
            trust_score: 0,
            trust_components: {},
            is_premium_analytics: false,
            upsell_message: 'Upgrade to Pro to access reputation tracking'
          }
        end

        begin
          service = ::CompanyDashboard::ReputationService.new(company: @company)
          data = service.reputation_data
          render json: data.merge(is_premium_analytics: true)
        rescue StandardError => e
          log_analytics_error('reputation', e)
          render json: {
            total_reviews: 0,
            avg_rating: 0,
            trust_score: 0,
            trust_components: {},
            is_premium_analytics: true
          }
        end
      end

      # GET /api/v1/company_dashboard/analytics/ranking
      def analytics_ranking
        authorize @company, :view_analytics?

        # ✅ FEATURE GATE: Ranking só para enterprise
        unless FeatureGateService.can_access?(@company, 'advanced_analytics')
          return render json: {
            rank_position: nil,
            ranking_score: 0,
            magic_quadrant_points: [],
            quadrant_meta: {},
            category_rankings: [],
            is_premium_analytics: false,
            upsell_message: 'Upgrade to Pro or Enterprise to access ranking analytics'
          }
        end

        begin
          category_id = params[:category_id].presence
          criterion_slug = params[:criterion_slug].presence
          service = ::CompanyDashboard::RankingService.new(
            company: @company,
            category_id: category_id,
            criterion_slug: criterion_slug
          )
          data = service.ranking_data

          render json: {
            rank_position: data[:current_position],
            ranking_score: data[:percentile],
            magic_quadrant_points: data[:magic_quadrant_competitors],
            quadrant_meta: data[:quadrant_meta],
            category_rankings: data[:category_rankings],
            is_premium_analytics: true
          }
        rescue StandardError => e
          log_analytics_error('ranking', e)
          render json: {
            rank_position: nil,
            ranking_score: 0,
            magic_quadrant_points: [],
            is_premium_analytics: true
          }
        end
      end

      # GET /api/v1/company_dashboard/trust_health
      # Returns detailed trust score breakdown with health indicators
      def trust_health
        authorize @company, :view_analytics?
        begin
          # Get stored trust score
          trust_record = CompanyTrustScore.find_by(company_id: @company.id)
          
          # Calculate current score using unified service with cache
          result = Rails.cache.fetch("company_#{@company.id}_trust_health_score_calc", expires_in: 1.hour) do
            TrustScore::CalculationService.new(@company).calculate!
          end
          
          # Determine health status based on score
          health_status = case result[:score]
                         when 0..30 then 'critical'
                         when 31..50 then 'poor'
                         when 51..70 then 'fair'
                         when 71..85 then 'good'
                         else 'excellent'
                         end
          
          # Calculate trend (would need historical data for real trend)
          score_trend = if trust_record&.computed_at
                          days_since = (Time.current - trust_record.computed_at).to_i / 1.day
                          if days_since < 7 then 'up'
                          elsif days_since < 30 then 'stable'
                          else 'stale'
                          end
                        else 'new'
                        end
          
          render json: {
            trust_score: result[:score],
            health_status: health_status,
            score_trend: score_trend,
            components: result[:components],
            computed_at: trust_record&.computed_at&.iso8601,
            verified: @company.verified?,
            last_recalculated_at: trust_record&.computed_at&.iso8601,
            recommendations: generate_trust_recommendations(result[:components], @company)
          }
        rescue StandardError => e
          log_analytics_error('trust_health', e)
          render json: { trust_score: 0, health_status: 'unknown', components: {}, recommendations: [] }
        end
      end

      # GET /api/v1/company_dashboard/intent_summary
      # Returns buyer intent score summary and top leads
      def intent_summary
        authorize @company, :view_analytics?
        
        begin
          unless defined?(IntentScore) && IntentScore.table_exists?
            return render json: {
              total_signals: 0,
              intent_distribution: {},
              top_leads: [],
              message: 'Intent tracking not enabled'
            }
          end

          # ✅ EAGER LOAD tudo que será usado - 1 query intent_scores + 1 query leads
          intent_scores = IntentScore
            .where(company_id: @company.id)
            .select(:id, :company_id, :lead_id, :total_score, :intent_level, :confidence_score, :total_signals_count, :recommended_action, :sla_window, :last_interaction_at, :updated_at, :top_signals)
            .includes(:lead_record)
            .order(total_score: :desc)
            .limit(10)
            .to_a

          top_leads = intent_scores.map do |score|
            lead = score.lead_record
            {
              id: score.id,
              lead_id: score.lead_id,
              name: lead&.name || "Prospecto ##{score.lead_id}",
              email: lead&.email,
              phone: lead&.phone,
              total_score: score.total_score,
              intent_level: score.intent_level,
              recommended_action: score.recommended_action,
              sla_window: score.sla_window,
              last_interaction_at: score.last_interaction_at&.iso8601,
              signals_count: score.total_signals_count,
              technical_profile: {
                monthly_kwh: lead&.monthly_kwh,
                bill_value: lead&.bill_value,
                system_size: lead&.system_size_band,
                decision_timeline: lead&.decision_timeline,
                estimated_budget: lead&.estimated_budget,
                project_profile: lead&.project_profile,
                product_vertical: lead&.product_vertical
              },
              marketing_data: {
                utm_source: lead&.utm_source,
                utm_medium: lead&.utm_medium,
                utm_campaign: lead&.utm_campaign,
                landing_path: lead&.landing_path,
                referrer: lead&.referrer_host
              },
              confidence_score: score.confidence_score,
              top_signals: score.top_signals || []
            }
          end

          render json: {
            total_signals: intent_scores.sum(:total_signals_count),
            avg_confidence: intent_scores.average(:confidence_score).to_f.round(2),
            intent_distribution: {
              cold: intent_scores.count { |s| s.intent_level == 'cold' },
              warm: intent_scores.count { |s| s.intent_level == 'warm' },
              hot: intent_scores.count { |s| s.intent_level == 'hot' },
              boiling: intent_scores.count { |s| s.intent_level == 'boiling' },
              immediate: intent_scores.count { |s| s.intent_level == 'immediate' },
              declared: intent_scores.count { |s| s.intent_level == 'declared' }
            },
            top_leads: top_leads,
            last_updated: intent_scores.max_by(&:updated_at)&.updated_at&.iso8601
          }
        rescue StandardError => e
          log_analytics_error('intent_summary', e)
          render json: { error: e.message }, status: :unprocessable_entity
        end
      end

      # GET /api/v1/company_dashboard/certification_progress
      # Returns badge/certification progress and pending verifications
      def certification_progress
        authorize @company, :view_analytics?
        begin
          badges = @company.badges
          all_badges = Badge.all
          
          # Current badges
          earned_badges = badges.map do |badge|
            {
              id: badge.id,
              name: badge.name,
              description: badge.description,
              icon_url: badge.icon_url,
              earned_at: @company.company_badges.find_by(badge_id: badge.id)&.created_at&.iso8601,
              verified: @company.company_badges.find_by(badge_id: badge.id)&.verified?
            }
          end
          
          # Available badges not yet earned
          available_badges = all_badges.where.not(id: badges.ids).map do |badge|
            {
              id: badge.id,
              name: badge.name,
              description: badge.description,
              requirements: badge.requirements,
              category: badge.badge_type
            }
          end
          
          # Verification status
          pending_verifications = @company.company_badges.where(verified: false).count
          
          render json: {
            earned_badges: earned_badges,
            available_badges: available_badges,
            total_badges: all_badges.count,
            earned_count: earned_badges.count,
            pending_verifications: pending_verifications,
            verification_progress: calculate_verification_progress(earned_badges, all_badges)
          }
        rescue StandardError => e
          log_analytics_error('certification_progress', e)
          render json: { earned_badges: [], available_badges: [], earned_count: 0 }
        end
      end

      # GET /api/v1/company_dashboard/assets
      def assets
        base_url = ENV['APP_HOST'] || 'https://avaliasolar.com.br'
        profile_url = "#{base_url}/empresas/#{@company.slug}"
        badge_svg_url = "#{base_url}/api/v1/badges/#{@company.slug}.svg"
        utm_params = "utm_source=badge&utm_medium=referral&utm_campaign=trust_badge"
        
        render json: {
          public_profile_url: profile_url,
          logo_url: @company.logo&.url,
          banner_url: @company.banner&.url,
          badge_url: badge_svg_url,
          badge_embed_code: "<a href=\"#{profile_url}?#{utm_params}\"><img src=\"#{badge_svg_url}\" alt=\"Selo AvaliaSolar\" /></a>",
          utm_ready_link: "#{profile_url}?#{utm_params}"
        }
      end

      # GET /api/v1/company_dashboard/stats
      def stats
        stats_service = ::CompanyDashboard::StatsService.new(@company)

        render json: {
          stats: stats_service.call,
          plan_features: @company.effective_plan_features || {},
          feature_access: @company.feature_access || {}
        }, status: :ok
      rescue StandardError => e
        Rails.logger.error(
          "[CompanyDashboard#stats] #{e.class}: #{e.message} " \
          "company_id=#{@company&.id} user_id=#{current_user&.id}"
        )
        Rails.logger.error("[CompanyDashboard#stats] backtrace=#{e.backtrace&.first(5)&.join(' | ')}")
        render json: {
          stats: ::CompanyDashboard::StatsService.new(nil).call,
          plan_features: {},
          feature_access: {}
        }, status: :ok
      end

      # GET /api/v1/company_dashboard/banner_subscriptions
      def banner_subscriptions
        subs = @company.banner_subscriptions.includes(:banner_offer).order(created_at: :desc)
        render json: {
          subscriptions: subs.as_json(include: { banner_offer: { only: %i[id name price_cents currency duration_days
                                                                          rules_json active] } })
        }
      end

      # POST /api/v1/company_dashboard/banner_checkout
      def banner_checkout
        offer = BannerOffer.find(params[:offer_id])

        # Generate a unique reference for the payment provider
        checkout_session_id = "PAY-#{SecureRandom.hex(8).upcase}"
        
        sub = @company.banner_subscriptions.create!(
          banner_offer: offer,
          status: 'pending_payment',
          provider: params[:provider] || 'stripe',
          checkout_session_id: checkout_session_id
        )

        # Generate Real Redirect URL
        checkout_service = Payment::CheckoutService.new(sub)
        redirect_url = checkout_service.create_checkout_session(sub.provider)

        render json: {
          subscription: sub.as_json(only: %i[id status provider checkout_session_id created_at]),
          redirect_url: redirect_url
        }, status: :created
      rescue ActiveRecord::RecordNotFound
        render json: { error: 'offer_not_found' }, status: :not_found
      end

      # POST /api/v1/company_dashboard/update_info
      def update_info
        authorize @company, :edit_company?
        if current_user&.role == 'admin'
          if @company.update(company_params)
            return render json: { message: 'Alterações aplicadas com sucesso' }, status: :ok
          end


          return render json: { errors: @company.errors }, status: :unprocessable_entity

        end

        direct_update_keys = %w[project_types services_offered]
        direct_update_attrs = company_params.slice(*direct_update_keys)
        @company.update(direct_update_attrs) if direct_update_attrs.present?

        pending_change = create_idempotent_pending_change(
          change_type: 'company_info',
          data: {
            attributes: company_params,
            previous_values: @company.attributes.slice(*company_params.keys)
          }
        )

        message = pending_change.previously_persisted? ?
          'Solicitação já enviada' :
          'Alterações enviadas para aprovação'

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
          message: message,
          pending_change: pending_change
        }, status: pending_change.previously_persisted? ? :ok : :created
      end

      # POST /api/v1/company_dashboard/add_categories
      def add_categories
        authorize @company, :edit_categories?
        
        pending_change = create_idempotent_pending_change(
          change_type: 'categories',
          data: {
            action: 'add',
            category_ids: params[:category_ids]
          }
        )

        message = pending_change.previously_persisted? ?
          'Solicitação já enviada' :
          'Solicitação de categorias enviada para aprovação'

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
          message: message,
          pending_change: pending_change
        }, status: pending_change.previously_persisted? ? :ok : :created
      end

      # POST /api/v1/company_dashboard/remove_category
      def remove_category
        authorize @company, :edit_categories?
        
        pending_change = create_idempotent_pending_change(
          change_type: 'categories',
          data: {
            action: 'remove',
            category_ids: [params[:category_id]]
          }
        )

        message = pending_change.previously_persisted? ?
          'Solicitação já enviada' :
          'Solicitação de remoção enviada para aprovação'

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
          message: message,
          pending_change: pending_change
        }, status: pending_change.previously_persisted? ? :ok : :created
      end

      # POST /api/v1/company_dashboard/update_ctas
      def update_ctas
        authorize @company, :edit_company?
        
        pending_change = create_idempotent_pending_change(
          change_type: 'cta_config',
          data: cta_params
        )

        render json: {
          message: 'Configurações de CTAs enviadas para aprovação',
          pending_change: pending_change
        }, status: pending_change.previously_persisted? ? :ok : :created
      end

      # POST /api/v1/company_dashboard/update_logo
      def update_logo
        authorize @company, :edit_company?
        file = params[:file]
        return render json: { error: 'Arquivo ausente' }, status: :unprocessable_entity if file.blank?

        unless %w[image/png image/jpeg].include?(file.content_type)
          return render json: { error: 'Formato inválido. Use PNG ou JPG' }, status: :unprocessable_entity
        end
        if file.size.to_i > 2.megabytes
          return render json: { error: 'Logo acima de 2MB' }, status: :unprocessable_entity
        end

        blob = ActiveStorage::Blob.create_and_upload!(io: file, filename: file.original_filename,
                                                      content_type: file.content_type)

        pending_change = create_idempotent_pending_change(
          change_type: 'logo',
          data: { signed_id: blob.signed_id }
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

        render json: { 
          message: 'Logo enviada para aprovação', 
          pending_change: pending_change 
        }, status: pending_change.previously_persisted? ? :ok : :created
      end

      # POST /api/v1/company_dashboard/update_banner
      def update_banner
        authorize @company, :edit_company?
        file = params[:file]
        return render json: { error: 'Arquivo ausente' }, status: :unprocessable_entity if file.blank?

        unless %w[image/png image/jpeg].include?(file.content_type)
          return render json: { error: 'Formato inválido. Use PNG ou JPG' }, status: :unprocessable_entity
        end
        if file.size.to_i > 5.megabytes
          return render json: { error: 'Banner acima de 5MB' }, status: :unprocessable_entity
        end

        blob = ActiveStorage::Blob.create_and_upload!(io: file, filename: file.original_filename,
                                                      content_type: file.content_type)
        begin
          blob.analyze
          meta = blob.metadata || {}
          w = meta['width']
          h = meta['height']
          if w && h && (w < 1920 || h < 600)
            return render json: { error: 'Dimensões mínimas recomendadas: 1920x600px' }, status: :unprocessable_entity
          end
        rescue StandardError => e
          Rails.logger.warn "Falha ao analisar dimensões do banner: #{e.message}"
        end

        pending_change = create_idempotent_pending_change(
          change_type: 'banner',
          data: { signed_id: blob.signed_id }
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

        render json: { 
          message: 'Banner enviado para aprovação', 
          pending_change: pending_change 
        }, status: pending_change.previously_persisted? ? :ok : :created
      end

      # GET /api/v1/company_dashboard/pending_changes
      def pending_changes
        changes = @company.pending_changes.pending.order(created_at: :desc)
        render json: {
          pending_changes: changes.as_json(
            include: { user: { only: %i[id name email] } }
          )
        }
      end

      # GET /api/v1/company_dashboard/notifications
      def notifications
        # Fetch notifications for the company
        notifications = []

        # Approved changes
        if @company&.pending_changes.respond_to?(:approved)
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
      rescue StandardError => e
        Rails.logger.error(
          "[CompanyDashboard#notifications] #{e.class}: #{e.message} " \
          "company_id=#{@company&.id} user_id=#{current_user&.id}"
        )
        Rails.logger.error("[CompanyDashboard#notifications] backtrace=#{e.backtrace&.first(5)&.join(' | ')}")
        render json: { notifications: [] }, status: :ok
      end

      # GET /api/v1/company_dashboard/media
      def media
        render json: { photos: @company.media_urls }
      end

      # GET /api/v1/company_dashboard/videos
      def videos
        videos = @company.published_videos.map do |v|
          { id: v.id, url: v.url, thumbnail_url: v.thumbnail_url, provider: v.provider, video_id: v.video_id }
        end
        render json: { videos: videos }
      end

      # POST /api/v1/company_dashboard/upload_media
      def upload_media
        authorize @company, :upload_media?
        unless current_user&.admin? || current_user&.role == 'company'
          return render json: { error: 'Unauthorized' }, status: :unauthorized
        end

        unless media_upload_permitted?
          return render json: { error: 'Plano necessário para upload de mídia' }, status: :forbidden
        end

        images = params[:images]
        return render json: { error: 'Nenhum arquivo enviado' }, status: :unprocessable_entity if images.blank?

        signed_ids = []
        Array(images).each do |io|
          blob = ActiveStorage::Blob.create_and_upload!(io: io, filename: io.original_filename,
                                                        content_type: io.content_type)
          signed_ids << blob.signed_id
        rescue StandardError => e
          Rails.logger.error "Erro ao criar blob: #{e.message}"
        end

        return render json: { error: 'Falha ao processar arquivos' }, status: :unprocessable_entity if signed_ids.empty?

        pending_change = create_idempotent_pending_change(
          change_type: 'media',
          data: { signed_ids: signed_ids }
        )

        render json: { 
          message: 'Mídia enviada para aprovação', 
          pending_change: pending_change 
        }, status: pending_change.previously_persisted? ? :ok : :created
      end

      # POST /api/v1/company_dashboard/add_video
      def add_video
        authorize @company, :upload_media?
        unless current_user&.admin? || current_user&.role == 'company'
          return render json: { error: 'Unauthorized' }, status: :unauthorized
        end
        unless media_upload_permitted?
          return render json: { error: 'Plano necessário para adicionar vídeo' }, status: :forbidden
        end

        url = params[:url].to_s
        result = Videos::YouTubeExtractor.extract(url)
        return render json: { error: result[:error] }, status: :unprocessable_entity unless result[:valid]

        pending_change = create_idempotent_pending_change(
          change_type: 'video',
          data: {
            url: url,
            provider: result[:provider],
            video_id: result[:video_id],
            thumbnail_url: result[:thumbnail_url],
            action: 'add'
          }
        )
        
        render json: { 
          message: 'Vídeo enviado para aprovação', 
          pending_change: pending_change 
        }, status: pending_change.previously_persisted? ? :ok : :created
      end

      # DELETE /api/v1/company_dashboard/remove_video
      def remove_video
        authorize @company, :upload_media?
        unless current_user&.admin? || current_user&.role == 'company'
          return render json: { error: 'Unauthorized' }, status: :unauthorized
        end
        unless media_upload_permitted?
          return render json: { error: 'Plano necessário para gerenciar vídeos' }, status: :forbidden
        end

        vid = params[:video_id].to_s.presence || params[:id].to_s
        return render json: { error: 'Parâmetro video_id ausente' }, status: :unprocessable_entity if vid.blank?

        pending_change = create_idempotent_pending_change(
          change_type: 'video',
          data: { video_id: vid, action: 'remove' }
        )
        
        render json: { 
          message: 'Remoção de vídeo enviada para aprovação', 
          pending_change: pending_change 
        }, status: pending_change.previously_persisted? ? :ok : :created
      end

      # GET /api/v1/company_dashboard/social_proof_reviews
      def social_proof_reviews
        authorize @company, :edit_reviews?
        
        # ✅ Eager load user para não ter N+1 + select para limitar colunas
        reviews = @company.reviews
          .select(:id, :rating, :comment, :status, :featured, :display_order, :verified, :created_at, :reply, :replied_at, :user_id, :company_id)
          .includes(:user)
          .order(created_at: :desc)

        feature_permission = current_user&.admin? || @company.can_use_social_proof?

        render json: {
          reviews: reviews.map do |review|
            {
              id: review.id,
              rating: review.rating.to_f,
              comment: review.comment.to_s,
              status: review.status,
              featured: review.featured,
              display_order: review.display_order,
              verified: review.verified,
              created_at: review.created_at,
              reply: review.reply,
              replied_at: review.replied_at,
              user_name: review.public_reviewer_name
            }
          end,
          permissions: {
            can_feature_reviews: feature_permission,
            social_proof_enabled: @company.respond_to?(:social_proof_enabled) ? @company.social_proof_enabled : false,
            featured_limit: Review::MAX_FEATURED_PER_COMPANY
          }
        }, status: :ok
      end

      # PATCH /api/v1/company_dashboard/social_proof_reviews/:id
      def update_social_proof_review
        authorize @company, :edit_reviews?
        review = @company.reviews.find(params[:id])
        attrs = social_proof_update_params
        wants_featured = ActiveModel::Type::Boolean.new.cast(attrs[:featured])

        if attrs.key?(:featured) && wants_featured && !(current_user&.admin? || @company.can_use_social_proof?)
          return render json: { error: 'Plano pago elegivel necessario para destacar reviews' }, status: :forbidden
        end

        if review.update(attrs)
          render json: {
            review: {
              id: review.id,
              featured: review.featured,
              display_order: review.display_order,
              status: review.status
            }
          }, status: :ok
        else
          render json: { errors: review.errors.full_messages }, status: :unprocessable_entity
        end
      rescue ActiveRecord::RecordNotFound
        render json: { error: 'Review not found for this company' }, status: :not_found
      end

      # GET /api/v1/company_dashboard/social_proof_stats
      def social_proof_stats
        authorize @company, :edit_reviews?
        approved_scope = @company.reviews.approved
        render json: {
          stats: {
            total_reviews: @company.reviews.count,
            approved_reviews: approved_scope.count,
            featured_reviews: @company.reviews.where(featured: true).count,
            average_rating: approved_scope.average(:rating).to_f.round(2),
            rating_distribution: rating_distribution_for(approved_scope),
            monthly_evolution: monthly_evolution_for(approved_scope)
          }
        }, status: :ok
      end

      private

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

        render json: { error: 'Company not found' }, status: :not_found and return unless @company
      rescue StandardError => e
        Rails.logger.error(
          "[CompanyDashboard#set_company] #{e.class}: #{e.message} " \
          "user_id=#{current_user&.id} admin=#{current_user&.admin?} " \
          "params=#{params.to_unsafe_h.slice('company_id', 'id', 'company')}"
        )
        Rails.logger.error("[CompanyDashboard#set_company] backtrace=#{e.backtrace&.first(5)&.join(' | ')}")
        fallback_company = current_user&.active_member_companies&.first
        if fallback_company
          @company = fallback_company
        else
          render json: { error: 'Company not found' }, status: :not_found
        end
      end

      def authenticate_company_user_or_admin!
        return if current_user&.admin?

        authenticate_company_user!
      end

      def authorize_dashboard_access!
        authorize @company, :view_dashboard?
      end

      def authenticate_company_user!
        memberships = current_user&.active_member_companies
        has_membership = memberships.present? && memberships.any?
        fallback_company = current_user&.company

        unless has_membership || fallback_company.present?
          return render json: { error: 'Unauthorized' }, status: :unauthorized
        end

        return render json: { error: 'Access pending approval' }, status: :forbidden unless current_user&.active?

        return unless !has_membership && company_active?(fallback_company)

        current_user.company_members.find_or_create_by!(
          company: fallback_company
        ) do |member|
          member.status = 'active'
          member.role = 'owner'
        end
      end

      def generate_trust_recommendations(components, company)
        recommendations = []
        
        # Verification recommendation
        recommendations << {
          type: 'verification',
          message: 'Complete company verification to gain +20 trust points',
          impact: 20,
          action_url: '/dashboard/settings/verification'
        } unless company.verified?
        
        # Reviews recommendation
        if components['reviews'].to_i < 5
          recommendations << {
            type: 'reviews',
            message: 'Encourage more customer reviews to improve trust',
            impact: (10 - components['reviews'].to_i).round(1),
            action_url: '/dashboard/reviews/invite'
          }
        end
        
        # Rating recommendation
        if company.rating_avg.to_f < 4.0
          recommendations << {
            type: 'rating',
            message: 'Improve average rating to boost trust score',
            impact: ((company.rating_avg.to_f / 5.0) * 20).round(1),
            action_url: '/dashboard/reviews'
          }
        end
        
        recommendations
      end

      def calculate_verification_progress(earned_badges, all_badges)
        return 0 if all_badges.count.zero?
        
        (earned_badges.count.to_f / all_badges.count * 100).round(1)
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
          :response_time_sla, :languages,
          :installation_warranty_years, :engineering_insurance, :delivered_projects_score,
          project_types: [], services_offered: [], equipment_brands: [], post_sales_capacity: []
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

      def social_proof_update_params
        source =
          if params[:review].present?
            params.require(:review).permit(:featured, :display_order)
          else
            params.permit(:featured, :display_order)
          end

        source.to_h.symbolize_keys
      end

      def company_active?(company)
        return false unless company
        return company.active_status? if company.respond_to?(:active_status?)

        company.status.to_s == 'active'
      end

      def rating_distribution_for(scope)
        distribution = scope.group(:rating).count
        {
          5 => distribution[5.0].to_i + distribution[5].to_i,
          4 => distribution[4.0].to_i + distribution[4].to_i,
          3 => distribution[3.0].to_i + distribution[3].to_i,
          2 => distribution[2.0].to_i + distribution[2].to_i,
          1 => distribution[1.0].to_i + distribution[1].to_i
        }
      end

      def monthly_evolution_for(scope)
        adapter = ActiveRecord::Base.connection.adapter_name.to_s.downcase
        expression =
          if adapter.include?('sqlite')
            "strftime('%Y-%m', created_at)"
          else
            "to_char(created_at, 'YYYY-MM')"
          end

        grouped = scope.group(Arel.sql(expression)).count
        grouped.sort.to_h
      end

      def calculate_conversion_rate
        # Now handled by CompanyDashboard::StatsService
      end

      def log_analytics_error(action, error)
        Rails.logger.error(
          "[CompanyDashboard#analytics_#{action}] #{error.class}: #{error.message} " \
          "company_id=#{@company&.id} user_id=#{current_user&.id}"
        )
        Rails.logger.error("[CompanyDashboard#analytics_#{action}] backtrace=#{error.backtrace&.first(5)&.join(' | ')}")
      end

      def format_magic_quadrant(category_rankings)
        # Simplified format for magic quadrant - using first category
        return [] if category_rankings.empty?

        ranking = category_rankings.first
        [{
          id: @company.id,
          name: @company.name,
          completenessOfVision: ranking[:percentile],
          abilityToExecute: ranking[:position],
          isCurrentCompany: true
        }]
      end

      def default_overview_payload
        {
          views_30d: 0,
          cta_clicks_30d: 0,
          whatsapp_clicks_30d: 0,
          leads_30d: 0,
          conversion_rate: 0,
          data_source: 'company_daily_stats_unavailable'
        }.merge(::CompanyDashboard::FreshnessProvider.call)
      end
    end
  end
end
