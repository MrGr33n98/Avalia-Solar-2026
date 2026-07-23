# frozen_string_literal: true

module Recommendation
  class ContextBuilder
    def self.call(request: nil, params: {}, current_user: nil)
      params ||= {}
      
      # 1. Explicit Parameters
      explicit_city = params[:city].presence
      explicit_state = params[:state].presence
      category_slug = params[:category_slug].presence
      segment = params[:segment].presence
      visitor_id = params[:visitor_id].presence || request&.cookies&.[]('avalia_visitor_id')

      if explicit_city.present? || explicit_state.present?
        return Context.new(
          city: explicit_city,
          state: explicit_state,
          category_slug: category_slug,
          segment: segment,
          visitor_id: visitor_id,
          location_source: :explicit_param
        )
      end

      # 2. Saved Lead/User Location
      if current_user.present?
        user_city = current_user.try(:city) || current_user.try(:company)&.city
        user_state = current_user.try(:state) || current_user.try(:company)&.state
        if user_city.present? || user_state.present?
          return Context.new(
            city: user_city,
            state: user_state,
            category_slug: category_slug,
            segment: segment,
            visitor_id: visitor_id,
            location_source: :user_profile
          )
        end
      end

      # 3. Cookie Location
      if request.present? && request.respond_to?(:cookies)
        cookie_city = request.cookies['user_city'].presence
        cookie_state = request.cookies['user_state'].presence
        if cookie_city.present? || cookie_state.present?
          return Context.new(
            city: cookie_city,
            state: cookie_state,
            category_slug: category_slug,
            segment: segment,
            visitor_id: visitor_id,
            location_source: :cookie
          )
        end
      end

      # 4. Reliable Edge/Proxy Headers (Cloudflare)
      if request.present? && request.respond_to?(:headers)
        cf_city = request.headers['CF-IPCity'].presence || request.headers['HTTP_CF_IPCITY'].presence
        cf_region = request.headers['CF-IPCountry-Region'].presence || request.headers['HTTP_CF_REGION'].presence
        if cf_city.present? || cf_region.present?
          return Context.new(
            city: cf_city,
            state: cf_region,
            category_slug: category_slug,
            segment: segment,
            visitor_id: visitor_id,
            location_source: :edge_header
          )
        end
      end

      # 5. Fallback National
      Context.new(
        category_slug: category_slug,
        segment: segment,
        visitor_id: visitor_id,
        location_source: :fallback_national
      )
    end
  end
end
