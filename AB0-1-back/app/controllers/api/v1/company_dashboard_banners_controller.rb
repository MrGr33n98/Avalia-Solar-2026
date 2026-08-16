module Api
  module V1
    class CompanyDashboardBannersController < Api::V1::BaseController
      before_action :authenticate_api_user
      before_action :require_company_user
      before_action :ensure_company
      before_action -> { authorize_feature!('promo_banner') }
      before_action :authorize_banner_read!
      before_action :authorize_banner_management!, only: %i[create update submit pause resume destroy export_audit export_audits acknowledge_export_alert]

      def index
        banners = current_company.banners.includes(banner_addon_subscriptions: :banner_addon)
                                 .order(created_at: :desc)
        
        quota = Banners::CompanyBannerQuotaService.call(current_company)

        stats = BannerDailyStat.where(banner_id: banners.pluck(:id)).select('SUM(views_count) as v, SUM(clicks_count) as c, SUM(leads_count) as l, SUM(cost_cents) as cost').to_a.first
        
        v = stats&.v.to_i
        c = stats&.c.to_i
        l = stats&.l.to_i
        cost = stats&.cost.to_i
        ctr = v.positive? ? (c.to_f / v * 100).round(2) : 0.0
        cpc = c.positive? ? (cost / c) : 0
        
        summary = {
          impressions: v,
          clicks: c,
          ctr: ctr,
          leads: l,
          investment_cents: cost,
          cpc_cents: cpc
        }

        banners_data = banners.map do |b|
          perf = BannerAnalytics::PerformanceService.call(b.id)[:metrics]
          
          now = Time.current
          active_addons = b.banner_addon_subscriptions.select do |sub|
            sub.status == 'active' && (sub.starts_at.nil? || sub.starts_at <= now) && (sub.ends_at.nil? || sub.ends_at >= now)
          end.map do |sub|
            {
              id: sub.banner_addon_id,
              name: sub.banner_addon.name,
              ends_at: sub.ends_at,
              days_remaining: sub.ends_at ? (sub.ends_at.to_date - Date.today).to_i : nil
            }
          end
          
          operational_status = if !b.active
            'paused'
          elsif b.moderation_status != 'approved'
            b.moderation_status
          elsif b.start_date && b.start_date > Time.current
            'scheduled'
          elsif b.end_date && b.end_date < Time.current
            'expired'
          else
            'active'
          end

          allowed_actions = []
          allowed_actions << 'edit' if %w[draft rejected approved].include?(b.moderation_status)
          allowed_actions << 'submit' if %w[draft rejected].include?(b.moderation_status)
          allowed_actions << 'pause' if b.active && operational_status == 'active'
          allowed_actions << 'resume' if !b.active && b.moderation_status == 'approved'
          allowed_actions << 'buy_addon' if operational_status == 'active' || operational_status == 'scheduled'
          allowed_actions << 'delete' if %w[draft rejected].include?(b.moderation_status)

          {
            id: b.id,
            title: b.title,
            thumbnail_url: b.respond_to?(:image_url) ? b.image_url : nil,
            link_url: b.link_url,
            banner_type: b.banner_type,
            operational_status: operational_status,
            moderation_status: b.moderation_status,
            rejected_reason: b.rejected_reason,
            position: b.position,
            slot_key: b.slot_key,
            starts_at: b.start_date,
            ends_at: b.end_date,
            days_remaining: b.end_date ? (b.end_date.to_date - Date.today).to_i : nil,
            performance: {
              impressions: perf[:impressions],
              clicks: perf[:clicks],
              ctr: perf[:ctr],
              leads: perf[:leads],
              investment_cents: (perf[:investment] * 100).to_i,
              cpc_cents: (perf[:cpc] * 100).to_i
            },
            active_addons: active_addons,
            delivery_health: delivery_health_for(b),
            allowed_actions: allowed_actions
          }
        end

        operational_health = BannerAnalytics::OperationalHealth.call(banner_ids: banners.map(&:id))
        placements = BannerPlacements::Catalog.all.map do |entry|
          { key: entry.key, label: entry.label, status: entry.status, dimensions: entry.dimensions, commercial: entry.commercial }
        end
        render json: { quota: quota, summary: summary, operational_health: operational_health,
                       placements: placements, banners: banners_data }
      end

      def export_audit
        format = params[:format].to_s.presence || 'json'
        unless %w[csv json].include?(format)
          return render json: { error: 'invalid_export_format' }, status: :unprocessable_entity
        end

        filters = params.permit(:days, :incident_type, :banner_id).to_h
        BannerAuditLog.create!(
          auditable: current_company,
          actor: current_user,
          action: 'export_incidents',
          source: 'company_dashboard',
          metadata_json: filters.merge('format' => format, 'record_count' => params[:record_count].to_i),
          ip_address: request.remote_ip
        )
        render json: { status: 'audited' }, status: :created
      end

      def export_audits
        page = [params[:page].to_i, 1].max
        per_page = [[params[:per_page].to_i, 1].max, 50].min
        scope = BannerAuditLog.where(auditable: current_company, action: 'export_incidents')
                              .order(created_at: :desc)
        scope = scope.where(actor_id: params[:actor_id]) if params[:actor_id].to_s.match?(/\A\d+\z/)
        scope = scope.where('created_at >= ?', parsed_audit_date(:from).beginning_of_day) if parsed_audit_date(:from)
        scope = scope.where('created_at <= ?', parsed_audit_date(:to).end_of_day) if parsed_audit_date(:to)
        scope = scope.where("metadata_json ->> 'format' = ?", params[:format]) if %w[csv json].include?(params[:format].to_s)
        scope = scope.where("metadata_json ->> 'incident_type' = ?", params[:incident_type]) if params[:incident_type].present? && params[:incident_type] != 'all'
        scope = scope.where("metadata_json ->> 'banner_id' = ?", params[:banner_id].to_s) if params[:banner_id].to_s.match?(/\A\d+\z/)
        total = scope.count
        audits = scope.offset((page - 1) * per_page).limit(per_page).map do |log|
          metadata = log.metadata_json || {}
          {
            id: log.id,
            action: log.action,
            actor_type: log.actor_type,
            actor_id: log.actor_id,
            format: metadata['format'],
            days: metadata['days'],
            incident_type: metadata['incident_type'],
            banner_id: metadata['banner_id'],
            record_count: metadata['record_count'].to_i,
            created_at: log.created_at
          }
        end
        render json: { audits: audits, meta: { page: page, per_page: per_page, total: total } }
      end

      def export_alerts
        alerts = BannerAuditLog.where(action: 'suspicious_export_alert', actor: current_user)
                              .order(created_at: :desc).limit(20)
        render json: { alerts: alerts.map { |log|
          metadata = log.metadata_json || {}
          { id: log.id, status: metadata['status'] || 'open', count: metadata['count'].to_i,
            threshold: metadata['threshold'].to_i, window_hours: metadata['window_hours'].to_i,
            created_at: log.created_at }
        } }
      end

      def acknowledge_export_alert
        alert = BannerAuditLog.where(action: 'suspicious_export_alert', actor: current_user).find(params[:id])
        metadata = (alert.metadata_json || {}).merge('status' => 'resolved', 'resolved_at' => Time.current.iso8601, 'resolution' => 'acknowledged_by_actor')
        alert.update!(metadata_json: metadata)
        BannerAuditLog.create!(auditable: alert, actor: current_user, action: 'suspicious_export_acknowledged',
                               source: 'company_dashboard', metadata_json: { 'alert_id' => alert.id })
        render json: { status: 'acknowledged', alert_id: alert.id }
      end

      def create
        banner = current_company.banners.new(banner_params)
        banner.moderation_status = 'draft' if banner.respond_to?(:moderation_status) && banner.moderation_status.blank?
        banner.active = false if banner.respond_to?(:active)
        attach_image!(banner)
        banner.save!

        render json: { banner: banner.as_json(methods: %i[image_url link_url]) }, status: :created
      end

      def update
        banner = current_company.banners.find(params[:id])
        banner.assign_attributes(banner_params)
        attach_image!(banner) if params[:image].present?
        banner.moderation_status = 'draft'
        banner.active = false
        banner.save!

        render json: { banner: banner.as_json(methods: %i[image_url link_url]) }
      end

      def submit
        banner = current_company.banners.find(params[:id])
        unless %w[draft rejected].include?(banner.moderation_status)
          return render json: { error: 'invalid_moderation_transition' }, status: :unprocessable_entity
        end

        placement = BannerPlacements::Catalog.fetch(banner.position)
        if placement.status != 'active'
          return render json: { error: 'placement_not_available', placement: banner.position }, status: :unprocessable_entity
        end

        banner.submit_for_review!
        render json: { banner: banner.as_json(methods: %i[image_url link_url]) }
      end

      def pause
        banner = current_company.banners.find(params[:id])
        unless banner.active?
          return render json: { error: 'banner_already_paused' }, status: :unprocessable_entity
        end

        banner.update!(active: false)
        render json: { banner: banner.as_json(methods: %i[image_url link_url]) }
      end

      def resume
        banner = current_company.banners.find(params[:id])
        unless banner.moderation_status == 'approved'
          return render json: { error: 'banner_must_be_approved' }, status: :unprocessable_entity
        end

        banner.update!(active: true)
        render json: { banner: banner.as_json(methods: %i[image_url link_url]) }
      end

      def performance
        banner = current_company.banners.find(params[:id])
        
        start_date = params[:start_date].present? ? Date.parse(params[:start_date]) : 30.days.ago.to_date
        end_date = params[:end_date].present? ? Date.parse(params[:end_date]) : Date.today
        
        performance_data = BannerAnalytics::PerformanceService.call(
          banner.id,
          start_date: start_date,
          end_date: end_date
        )
        
        render json: performance_data
      end


      def delivery_health_for(banner)
        checks = []
        checks << { key: 'active', label: 'Banner ativo', ok: banner.active? }
        checks << { key: 'moderation', label: 'Moderação aprovada', ok: banner.moderation_status == 'approved' }
        checks << { key: 'schedule', label: 'Período válido', ok: banner.start_date.blank? || banner.start_date <= Time.current }
        checks << { key: 'expiration', label: 'Não expirado', ok: banner.end_date.blank? || banner.end_date >= Time.current }
        checks << { key: 'image', label: 'Imagem anexada', ok: banner.image.attached? }
        checks << { key: 'position', label: 'Posição definida', ok: banner.position.present? }
        checks << { key: 'slot', label: 'Slot definido', ok: banner.slot_key.present? || banner.position.present? }
        checks << { key: 'targeting', label: 'Público-alvo compatível', ok: Array(banner.target_states).blank? && Array(banner.target_cities).blank? || banner.company_id.present? }

        if banner.sponsored? && banner.company_id.present?
          now = Time.current
          legacy_subscription = current_company.banner_subscriptions
                                             .where(status: 'active')
                                             .where('starts_at <= ?', now)
                                             .where('ends_at IS NULL OR ends_at >= ?', now)
                                             .exists?
          addon_subscription = banner.banner_addon_subscriptions
                                    .where(company_id: current_company.id, status: 'active')
                                    .where('starts_at <= ?', now)
                                    .where('ends_at IS NULL OR ends_at >= ?', now)
                                    .exists?
          checks << { key: 'contract', label: 'Contrato ativo', ok: legacy_subscription || addon_subscription }
        end

        failed = checks.reject { |check| check[:ok] }
        { status: failed.empty? ? 'healthy' : 'blocked', checks: checks, blockers: failed.map { |check| check[:key] } }
      end

      def export
        banner = current_company.banners.find(params[:id])
        start_date = params[:start_date].present? ? Date.parse(params[:start_date]) : 30.days.ago.to_date
        end_date = params[:end_date].present? ? Date.parse(params[:end_date]) : Date.current
        performance_data = BannerAnalytics::PerformanceService.call(
          banner.id,
          start_date: start_date,
          end_date: end_date
        )

        respond_to do |format|
          format.json { render json: performance_data }
          format.csv do
            require 'csv'
            csv = CSV.generate(headers: true) do |output|
              output << %w[day impressions clicks leads ctr]
              performance_data[:time_series].each do |row|
                output << [row[:day], row[:impressions], row[:clicks], row[:leads], row[:ctr]]
              end
            end
            send_data csv, filename: "banner-#{banner.id}-#{start_date}-#{end_date}.csv", type: 'text/csv'
          end
        end
      rescue Date::Error
        render json: { error: 'invalid_date_range' }, status: :unprocessable_entity
      end

      def destroy
        banner = current_company.banners.find(params[:id])
        unless %w[draft rejected].include?(banner.moderation_status)
          return render json: { error: 'banner_cannot_be_deleted' }, status: :unprocessable_entity
        end

        banner.destroy!
        head :no_content
      end

      private

      def ensure_company
        render(json: { error: 'company_not_found' }, status: :not_found) unless current_company
      end

      def current_company
        current_user&.company
      end

      def authorize_feature!(feature_name)
        return true if current_company&.feature_enabled?(feature_name)

        Rails.logger.warn("[FeatureDenied] user_id=#{current_user&.id} company_id=#{current_company&.id} plan_id=#{current_company&.plan_id} feature=#{feature_name} request_id=#{request.request_id} reason=feature_disabled")
        render json: { error: 'feature_disabled', code: 'FEATURE_DISABLED', feature: feature_name, message: "Recurso '#{feature_name}' não está habilitado no plano desta empresa." }, status: :forbidden
        false
      end

      def authorize_banner_read!
        authorize current_company, :view_banners?, policy_class: CompanyDashboardPolicy
      end

      def authorize_banner_management!
        authorize current_company, :update_banner?, policy_class: CompanyDashboardPolicy
      end

      def parsed_audit_date(key)
        Date.iso8601(params[key].to_s)
      rescue Date::Error, ArgumentError
        nil
      end

      def banner_params
        params.permit(
          :title,
          :link,
          :active,
          :sponsored,
          :banner_type,
          :position,
          :category_id,
          :start_date,
          :end_date
        )
      end

      def attach_image!(banner)
        return unless params[:image].present?

        banner.image.attach(params[:image])
      end
    end
  end
end
