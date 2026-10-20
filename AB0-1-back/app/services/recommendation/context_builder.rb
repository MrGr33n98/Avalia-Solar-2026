# frozen_string_literal: true

module Recommendation
  class ContextBuilder
    def self.call(request: nil, params: {}, current_user: nil)
      params ||= {}
      
      # 1. Explicit Parameters
      explicit_city = params[:city].presence
      explicit_state = params[:state].presence
      category_slug = params[:category_slug].presence
      category_id = params[:category_id].presence
      segment = params[:segment].presence
      visitor_id = params[:visitor_id].presence || request&.cookies&.[]('avalia_visitor_id')
      exclude_company_id = params[:exclude_company_id].presence
      context_company_id = params[:context_company_id].presence

      context_company = Company.find_by(id: context_company_id) if context_company_id.present?
      if context_company.present?
        exclude_company_id ||= context_company.id
        segment ||= context_company.segment
        category_slug ||= context_company.primary_category&.seo_url || context_company.categories.first&.slug
        category_id ||= context_company.primary_category_id || context_company.categories.first&.id
      end

      if explicit_city.present? || explicit_state.present?
        return Context.new(
          city: explicit_city,
          state: explicit_state,
          category_slug: category_slug,
          category_id: category_id,
          segment: segment,
          visitor_id: visitor_id,
          location_source: :explicit_param,
          exclude_company_id: exclude_company_id,
          context_company_id: context_company_id
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
            category_id: category_id,
            segment: segment,
            visitor_id: visitor_id,
            location_source: :user_profile,
            exclude_company_id: exclude_company_id,
            context_company_id: context_company_id
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
            category_id: category_id,
            segment: segment,
            visitor_id: visitor_id,
            location_source: :cookie,
            exclude_company_id: exclude_company_id,
            context_company_id: context_company_id
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
            category_id: category_id,
            segment: segment,
            visitor_id: visitor_id,
            location_source: :edge_header,
            exclude_company_id: exclude_company_id,
            context_company_id: context_company_id
          )
        end
      end

      # 5. Fallback Company Profile Location (sede da empresa visitada)
      if context_company.present? && (context_company.city.present? || context_company.state.present?)
        return Context.new(
          city: context_company.city,
          state: context_company.state,
          category_slug: category_slug,
          category_id: category_id,
          segment: segment,
          visitor_id: visitor_id,
          location_source: :company_profile_fallback,
          exclude_company_id: exclude_company_id,
          context_company_id: context_company_id
        )
      end

      # 6. Fallback National
      Context.new(
        category_slug: category_slug,
        category_id: category_id,
        segment: segment,
        visitor_id: visitor_id,
        location_source: :fallback_national,
        exclude_company_id: exclude_company_id,
        context_company_id: context_company_id
      )
    end
  end
end
