# frozen_string_literal: true

module Api
  module V1
    module Reviewer
      class BrandUsagesController < Api::V1::Reviewer::BaseController
        rescue_from ActiveRecord::StaleObjectError, with: :handle_stale_object

        before_action :set_usage, only: %i[show update destroy]

        def index
          status = params[:status].presence || 'active'
          scope = current_user.reviewer_brand_usages
                              .where(status: status)
                              .includes(brand: { logo_attachment: :blob })
                              .order(created_at: :desc)

          limit = params[:limit].present? ? [params[:limit].to_i, 50].min : 20
          limit = 20 if limit <= 0

          if params[:cursor].present?
            cursor_id = params[:cursor].to_i
            scope = scope.where('id < ?', cursor_id)
          end

          total = scope.count
          usages = scope.limit(limit)

          response.set_header('Cache-Control', 'private, no-store')

          render json: {
            data: usages.map(&:as_owner_json),
            meta: {
              limit: limit,
              total: total,
              next_cursor: usages.last&.id
            }
          }
        end

        def show
          response.set_header('Cache-Control', 'private, no-store')
          render json: { data: @usage.as_owner_json }
        end

        def create
          brand = Brand.active.find_by(id: brand_usage_params[:brand_id])
          unless brand
            return render json: {
              errors: [{ field: 'brand_id', message: 'Marca não encontrada ou inativa', code: 'BRAND_INACTIVE' }]
            }, status: :unprocessable_entity
          end

          existing = current_user.reviewer_brand_usages.find_by(
            brand_id: brand.id,
            usage_context: brand_usage_params[:usage_context]
          )

          if existing&.status == 'disabled'
            # Reativação idempotente
            ReviewerBrandUsage.transaction do
              existing.status = 'active'
              existing.description = brand_usage_params[:description] if brand_usage_params[:description].present?
              existing.experience_since = brand_usage_params[:experience_since] if brand_usage_params[:experience_since].present?
              existing.save!
              existing.events.create!(
                actor: current_user,
                action: 'reactivated',
                old_status: 'disabled',
                new_status: 'active'
              )
            end
            return render json: { data: existing.as_owner_json }, status: :ok
          elsif existing&.status == 'active'
            return render json: {
              errors: [{ field: 'brand_id', message: 'Marca já cadastrada neste contexto de uso', code: 'CONFLICT' }]
            }, status: :conflict
          end

          usage = current_user.reviewer_brand_usages.new(brand_usage_params.except(:consent_confirmed))
          usage.source = 'manual'
          usage.verification_status = 'self_declared'
          usage.status = 'active'

          if brand_usage_params[:visibility] == 'public' && brand_usage_params[:consent_confirmed]
            usage.opted_in_at = Time.current
          end

          ReviewerBrandUsage.transaction do
            usage.save!
            usage.events.create!(
              actor: current_user,
              action: 'created',
              new_status: 'active'
            )
          end

          render json: { data: usage.as_owner_json }, status: :created
        rescue ActiveRecord::RecordInvalid => e
          render json: { errors: e.record.errors.full_messages }, status: :unprocessable_entity
        end

        def update
          old_status = @usage.status
          params_to_update = brand_usage_params.except(:consent_confirmed)

          if brand_usage_params[:visibility] == 'public'
            if brand_usage_params[:consent_confirmed] && brand_usage_params[:consent_version].present?
              params_to_update[:opted_in_at] = Time.current
            else
              return render json: {
                errors: [{ field: 'visibility', message: 'Consentimento obrigatório para visibilidade pública', code: 'CONSENT_REQUIRED' }]
              }, status: :unprocessable_entity
            end
          elsif brand_usage_params[:visibility] == 'private'
            params_to_update[:visibility] = 'private'
          end

          ReviewerBrandUsage.transaction do
            @usage.update!(params_to_update)
            @usage.events.create!(
              actor: current_user,
              action: 'updated',
              old_status: old_status,
              new_status: @usage.status,
              metadata: { updated_fields: params_to_update.keys }
            )
          end

          render json: { data: @usage.as_owner_json }
        rescue ActiveRecord::RecordInvalid => e
          render json: { errors: e.record.errors.full_messages }, status: :unprocessable_entity
        end

        def destroy
          old_status = @usage.status
          ReviewerBrandUsage.transaction do
            @usage.soft_delete!
            @usage.events.create!(
              actor: current_user,
              action: 'disabled',
              old_status: old_status,
              new_status: 'disabled'
            )
          end

          head :no_content
        end

        def summary
          active_usages = current_user.reviewer_brand_usages.active

          total_brands = active_usages.distinct.count(:brand_id)
          total_usages = active_usages.count
          verified_usages = active_usages.where(verification_status: 'evidence_verified').count
          public_usages = active_usages.where(visibility: 'public').count
          by_context = active_usages.group(:usage_context).count

          response.set_header('Cache-Control', 'private, no-store')

          render json: {
            data: {
              total_brands: total_brands,
              total_usages: total_usages,
              verified_usages: verified_usages,
              public_usages: public_usages,
              by_context: by_context
            }
          }
        end

        private

        def set_usage
          @usage = current_user.reviewer_brand_usages.find(params[:id])
        end

        def brand_usage_params
          params.require(:brand_usage).permit(
            :brand_id,
            :usage_context,
            :experience_since,
            :description,
            :visibility,
            :consent_version,
            :consent_confirmed,
            :lock_version
          )
        end

        def handle_stale_object
          render json: {
            error: 'Conflito de concorrência detectado. Os dados foram atualizados por outra requisição.',
            code: 'CONFLICT'
          }, status: :conflict
        end
      end
    end
  end
end
