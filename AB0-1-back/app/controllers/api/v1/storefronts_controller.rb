# frozen_string_literal: true

module Api
  module V1
    class StorefrontsController < ApplicationController
      skip_before_action :authenticate_request, raise: false
      skip_before_action :authorize_request, raise: false

      def show
        slug = params[:slug] || params[:id]
        payload = ::Storefront::PublicProfileService.call(slug: slug)

        response.headers['Cache-Control'] = 'public, max-age=300, stale-while-revalidate=3600'
        render json: payload, status: :ok
      rescue ::Storefront::PublicProfileService::NotFoundError => e
        render json: { error: e.message }, status: :not_found
      rescue StandardError => e
        Rails.logger.error("[Api::V1::StorefrontsController#show] #{e.class}: #{e.message}")
        render json: { error: 'Falha interna ao carregar vitrine' }, status: :internal_server_error
      end
    end
  end
end

