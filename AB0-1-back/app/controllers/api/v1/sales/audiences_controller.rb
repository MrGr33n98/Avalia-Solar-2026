# frozen_string_literal: true

module Api
  module V1
    module Sales
      class AudiencesController < BaseController
        before_action :authenticate_api_user

        def index
          authorize ::Sales::Audience, :index?
          page = [params.fetch(:page, 1).to_i, 1].max
          per_page = [[params.fetch(:per_page, 20).to_i, 1].max, 100].min
          scope = saved_audiences.order(updated_at: :desc)
          paginated = scope.page(page).per(per_page)
          render json: { audiences: paginated, meta: { page: page, current_page: page, per_page: per_page, total_count: scope.count, total_pages: paginated.total_pages } }
        end

        def show
          audience = saved_audiences.find(params[:id])
          authorize audience
          render json: { audience: audience }
        end

        def create
          authorize ::Sales::Audience, :create?
          audience = saved_audiences.new(audience_params.merge(created_by: current_user))
          if audience.save
            render json: { audience: audience }, status: :created
          else
            render json: { error: 'AUDIENCE_INVALID', message: audience.errors.full_messages.to_sentence }, status: :unprocessable_entity
          end
        end

        def update
          audience = saved_audiences.find(params[:id])
          authorize audience
          if audience.update(audience_params)
            render json: { audience: audience }
          else
            render json: { error: 'AUDIENCE_INVALID', message: audience.errors.full_messages.to_sentence }, status: :unprocessable_entity
          end
        end

        def destroy
          audience = saved_audiences.find(params[:id])
          authorize audience
          audience.destroy!
          head :no_content
        end

        def preview
          company = current_user.company
          unless company
            render json: { errors: ['Empresa (tenant) não configurada ou não autorizada.'] }, status: :forbidden
            return
          end

          filter = params[:audience_filter] || params[:filter] || {}
          filter = filter.permit(:state, :city, :segment, :search, tag_ids: []).to_h if filter.respond_to?(:permit)
          page = params[:page] || 1
          per_page = params[:per_page] || 20

          result = ::Sales::Campaigns::AudienceResolver.call(
            company: company,
            audience_filter: filter,
            page: page,
            per_page: per_page
          )

          sample_contacts = (result[:records] || []).map do |c|
            {
              id: c.id,
              first_name: c.first_name,
              last_name: c.last_name,
              email: c.email,
              job_title: c.job_title,
              account_name: c.account&.name,
              city: c.account&.city,
              state: c.account&.state
            }
          end

          render json: {
            total_count: result[:total_count] || 0,
            page: result[:page] || page,
            per_page: result[:per_page] || per_page,
            total_pages: result[:total_pages] || 0,
            sample_contacts: sample_contacts
          }
        rescue StandardError => e
          Rails.logger.error("Audience preview query failed: #{e.class}: #{e.message}")
          render json: {
            total_count: 0,
            page: 1,
            per_page: 20,
            total_pages: 0,
            sample_contacts: [],
            error: 'AUDIENCE_PREVIEW_FAILED',
            message: e.message
          }, status: :ok
        end

        def segments
          company = current_user.company
          unless company
            render json: { errors: ['Empresa (tenant) não configurada ou não autorizada.'] }, status: :forbidden
            return
          end
          cache_key = "sales:audience_segments:v1:company:#{company.id}"
          payload = Rails.cache.fetch(cache_key, expires_in: 10.minutes) do
            user_ids = User.where(company_id: company.id).select(:id)
            accounts = ::Sales::Account.where(company_id: company.id).or(::Sales::Account.where(owner_id: user_ids))
            {
              states: accounts.where.not(state: [nil, '']).distinct.pluck(:state).sort,
              cities: accounts.where.not(city: [nil, '']).distinct.pluck(:city).sort,
              company_types: accounts.where.not(segment: [nil, '']).distinct.pluck(:segment).sort,
              tags: ::Sales::Tag.where(company_id: company.id).pluck(:id, :name, :color).map { |id, name, color| { id: id, name: name, color: color } }
            }
          end
          render json: payload
        end
        private

        def saved_audiences
          ::Sales::Audience.where(company_id: current_user.company_id)
        end

        def audience_params
          params.require(:audience).permit(:name, :description, :kind, :active, filter_definition: [:state, :city, :segment, :search, { tag_ids: [] }])
        end
      end
    end
  end
end
