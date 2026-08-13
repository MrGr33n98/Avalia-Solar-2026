module Banners
  class BannerDeliveryQuery
    def self.call(params = {})
      new(params).call
    end

    def initialize(params)
      @params = params
    end

    def call
      scope = Banner.currently_active
      scope = apply_catalog_availability(scope)
      scope = apply_contract_eligibility(scope)
      scope = scope.where(position: @params[:position]) if @params[:position].present?
      scope = scope.where(slot_key: @params[:slot_key]) if @params[:slot_key].present? && Banner.column_names.include?('slot_key')
      scope = apply_company(scope)
      scope = apply_category(scope)
      scope = apply_location(scope)
      scope = apply_frequency_cap(scope)
      scope = apply_fair_rotation(scope)
      scope = scope.limit(@params[:limit].to_i) if @params[:limit].to_i.positive?
      scope.includes(:categories, :company, image_attachment: :blob)
    end

    private

    def apply_catalog_availability(scope)
      active_positions = BannerPlacements::Catalog.all.select { |entry| entry.status == 'active' }.map(&:key)
      scope.where(position: active_positions)
    end

    def apply_contract_eligibility(scope)
      return scope unless banner_ads_v2_enabled?
      return scope unless Banner.column_names.include?('sponsored') && Banner.column_names.include?('company_id')

      now = Time.current
      scope.where(<<~SQL.squish, now, now, now, now)
        banners.sponsored = FALSE
        OR banners.company_id IS NULL
        OR EXISTS (
          SELECT 1 FROM banner_subscriptions
          WHERE banner_subscriptions.company_id = banners.company_id
            AND banner_subscriptions.status = 'active'
            AND banner_subscriptions.starts_at <= ?
            AND (banner_subscriptions.ends_at IS NULL OR banner_subscriptions.ends_at >= ?)
        )
        OR EXISTS (
          SELECT 1 FROM banner_addon_subscriptions
          WHERE banner_addon_subscriptions.company_id = banners.company_id
            AND banner_addon_subscriptions.banner_id = banners.id
            AND banner_addon_subscriptions.status = 'active'
            AND banner_addon_subscriptions.starts_at <= ?
            AND (banner_addon_subscriptions.ends_at IS NULL OR banner_addon_subscriptions.ends_at >= ?)
        )
      SQL
    end

    def banner_ads_v2_enabled?
      ENV.fetch('BANNER_ADS_V2', 'true').casecmp('true').zero?
    end

    def apply_company(scope)
      return scope unless @params[:company_id].present? && Banner.column_names.include?('company_id')

      scope.where('banners.company_id = ? OR banners.company_id IS NULL', @params[:company_id])
    end

    def apply_category(scope)
      return scope unless @params[:category_id].present?

      if Banner.reflect_on_association(:categories) && ActiveRecord::Base.connection.table_exists?(:banners_categories)
        category_id = @params[:category_id].to_i
        if Banner.column_names.include?('category_id')
          scope.where(<<~SQL.squish, cat_id: category_id)
            EXISTS (
              SELECT 1 FROM banners_categories
              WHERE banners_categories.banner_id = banners.id
                AND banners_categories.category_id = :cat_id
            )
            OR banners.category_id = :cat_id
            OR (
              NOT EXISTS (
                SELECT 1 FROM banners_categories
                WHERE banners_categories.banner_id = banners.id
              )
              AND banners.category_id IS NULL
            )
          SQL
        else
          scope.where(<<~SQL.squish, cat_id: category_id)
            EXISTS (
              SELECT 1 FROM banners_categories
              WHERE banners_categories.banner_id = banners.id
                AND banners_categories.category_id = :cat_id
            )
            OR NOT EXISTS (
              SELECT 1 FROM banners_categories
              WHERE banners_categories.banner_id = banners.id
            )
          SQL
        end
      else
        scope.where(category_id: @params[:category_id])
      end
    end

    def apply_fair_rotation(scope)
      window = @params[:rotation_window_seconds].to_i
      window = 3_600 if window <= 0
      bucket = (Time.current.to_i / window).floor
      scope.order(priority: :asc, sponsored: :desc)
           .order(Arel.sql("md5(concat(banners.id::text, '-#{bucket}')) ASC"))
           .order(created_at: :desc)
    end

    def apply_frequency_cap(scope)
      scope
    end

    def apply_location(scope)
      if @params[:state].present? && Banner.column_names.include?('target_states')
        state = @params[:state].to_s.strip.upcase
        scope = scope.where("target_states = '{}' OR target_states IS NULL OR ? = ANY(target_states)", state)
      end

      if @params[:city].present? && Banner.column_names.include?('target_cities')
        city = @params[:city].to_s.strip
        scope = scope.where("target_cities = '{}' OR target_cities IS NULL OR ? = ANY(target_cities)", city)
      end

      scope
    end
  end
end
