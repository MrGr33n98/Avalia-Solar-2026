# frozen_string_literal: true

module Api
  module V1
    class BrandsController < BaseController
      before_action :set_brand, only: %i[show]

      def index
        limit = params[:limit].present? ? [params[:limit].to_i, 50].min : 20
        limit = 20 if limit <= 0

        scope = Brand.active.with_attached_logo
        scope = scope.search_by_query(params[:q]) if params[:q].present?

        # Cursor pagination (baseado em ID incremental)
        if params[:cursor].present?
          cursor_id = params[:cursor].to_i
          scope = scope.where('brands.id > ?', cursor_id)
        end

        total = scope.count
        brands = scope.limit(limit)

        next_cursor = brands.last&.id if brands.size == limit

        response.set_header('Cache-Control', 'public, max-age=60, stale-while-revalidate=300')

        render json: {
          data: brands.map(&:as_catalog_json),
          meta: {
            limit: limit,
            total: total,
            next_cursor: next_cursor
          }
        }
      end

      def show
        render json: {
          data: @brand.as_catalog_json
        }
      end

      private

      def set_brand
        @brand = Brand.find_by_value(params[:id])
        return if @brand

        render_error('Fabricante não encontrado', :not_found, code: 'BRAND_NOT_FOUND')
      end
    end
  end
end

