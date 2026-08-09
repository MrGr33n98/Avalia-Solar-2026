module Api
  module V1
    class CompanyDashboardBannersController < Api::V1::BaseController
      before_action :authenticate_api_user
      before_action :require_company_user
      before_action :ensure_company
      before_action -> { authorize_feature!('promo_banner') }

      def index
        banners = current_company.banners.includes(:banner_addon_subscriptions).order(created_at: :desc)
        
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
          
          active_addons = b.banner_addon_subscriptions.select { |s| s.status == 'active' }.map do |sub|
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

          allowed_actions = ['edit']
          allowed_actions << 'pause' if b.active && operational_status == 'active'
          allowed_actions << 'resume' if !b.active && operational_status == 'paused'
          allowed_actions << 'buy_addon' if operational_status == 'active' || operational_status == 'scheduled'

          {
            id: b.id,
            title: b.title,
            thumbnail_url: b.respond_to?(:image_url) ? b.image_url : nil,
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
            allowed_actions: allowed_actions
          }
        end

        render json: { quota: quota, summary: summary, banners: banners_data }
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
        banner.save!

        render json: { banner: banner.as_json(methods: %i[image_url link_url]) }
      end

      def submit
        banner = current_company.banners.find(params[:id])
        banner.submit_for_review! if banner.respond_to?(:submit_for_review!)
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

      def destroy
        banner = current_company.banners.find(params[:id])
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

        render json: { error: 'plan_upgrade_required', feature: feature_name }, status: :forbidden
        false
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
