# frozen_string_literal: true

module Mcp
  class SearchCompaniesService < BaseService
    def call
      query = arguments[:query].to_s.strip
      city = arguments[:city].to_s.strip
      state = arguments[:state].to_s.strip
      category = arguments[:category].to_s.strip
      if query.blank? && city.blank? && state.blank? && category.blank?
        raise Error.new(code: 'invalid_params', message: 'Informe uma busca ou localização.')
      end

      scope = active_companies.includes(:categories)
      scope = text_filter(scope, query) if query.present?
      scope = scope.where('unaccent(lower(companies.city)) = unaccent(lower(?))', city) if city.present?
      scope = scope.where('upper(companies.state) = ?', state.upcase) if state.present?
      scope = scope.joins(:categories).where('unaccent(lower(categories.name)) LIKE unaccent(lower(?))', "%#{escape(category)}%") if category.present?
      scope = scope.where(verified: true) if ActiveModel::Type::Boolean.new.cast(arguments[:verified])

      companies = scope.distinct.order(verified: :desc, rating_avg: :desc, rating_count: :desc).limit(limit)
      { companies: companies.map { |company| public_company(company) }, count: companies.length }
    end

    private

    def text_filter(scope, query)
      term = "%#{escape(query)}%"
      scope.left_joins(:categories).where(
        'unaccent(lower(companies.name)) LIKE unaccent(lower(:term)) OR ' \
        'unaccent(lower(companies.slug)) LIKE unaccent(lower(:term)) OR ' \
        'unaccent(lower(COALESCE(companies.description, \'\'))) LIKE unaccent(lower(:term)) OR ' \
        'unaccent(lower(COALESCE(companies.services_offered::text, \'\'))) LIKE unaccent(lower(:term)) OR ' \
        'unaccent(lower(COALESCE(categories.name, \'\'))) LIKE unaccent(lower(:term))', term: term
      )
    end

    def escape(value)
      ActiveRecord::Base.sanitize_sql_like(value.to_s)
    end
  end
end
