# frozen_string_literal: true

module Api
  module V1
    module Reviewer
      class PortfolioProjectsController < BaseController
        before_action :set_project, only: %i[show update destroy]

        # GET /api/v1/reviewer/portfolio_projects
        def index
          status_param = params[:status].presence || 'active'
          scope = current_user.reviewer_portfolio_projects
                              .includes(:brand_usages, brand_usages: :brand)

          scope = scope.where(status: status_param) if status_param != 'all'
          scope = scope.where(project_type: params[:project_type]) if params[:project_type].present?

          limit = [params[:limit].to_i, 50].select(&:positive?).first || 20
          offset = [params[:offset].to_i, 0].max

          total = scope.count
          projects = scope.order(created_at: :desc).limit(limit).offset(offset)

          render json: {
            data: projects.map(&:as_owner_json),
            meta: {
              total: total,
              limit: limit,
              offset: offset
            }
          }
        end

        # GET /api/v1/reviewer/portfolio_projects/summary
        def summary
          active_projects = current_user.reviewer_portfolio_projects.active

          total_projects = active_projects.count
          total_capacity = active_projects.where.not(capacity_kwp: nil).sum(:capacity_kwp).to_f
          verified_count = active_projects.where(verification_status: 'evidence_verified').count
          public_count = active_projects.where(visibility: 'public').count

          by_type = ReviewerPortfolioProject::PROJECT_TYPES.index_with do |pt|
            active_projects.where(project_type: pt).count
          end

          render json: {
            data: {
              total_projects: total_projects,
              total_capacity_kwp: total_capacity,
              verified_projects: verified_count,
              public_projects: public_count,
              by_type: by_type
            }
          }
        end

        # GET /api/v1/reviewer/portfolio_projects/:id
        def show
          render json: { data: @project.as_owner_json }
        end

        # POST /api/v1/reviewer/portfolio_projects
        def create
          project = current_user.reviewer_portfolio_projects.new(project_params)
          project.verification_status = 'self_declared'
          project.status = 'active'

          if project_params[:visibility] == 'public' && params[:consent_confirmed] == true
            project.opted_in_at = Time.current
            project.consent_version = params[:consent_version].presence || 'reviewer-projects-v1'
          end

          ActiveRecord::Base.transaction do
            project.save!
            sync_brand_usages(project, params[:brand_usage_ids])

            ReviewerPortfolioProjectEvent.create!(
              reviewer_portfolio_project: project,
              actor: current_user,
              action: 'created',
              new_status: 'active',
              metadata: { title: project.title, project_type: project.project_type }
            )
          end

          capture_analytics('reviewer_portfolio_project_created', {
            project_type: project.project_type,
            visibility: project.visibility,
            capacity_kwp: project.capacity_kwp&.to_f
          })

          render json: { data: project.as_owner_json }, status: :created
        rescue ActiveRecord::RecordInvalid => e
          render json: { error: e.record.errors.full_messages }, status: :unprocessable_entity
        end

        # PATCH /api/v1/reviewer/portfolio_projects/:id
        def update
          if project_params[:visibility] == 'public' && params[:consent_confirmed] == true
            @project.opted_in_at = Time.current
            @project.consent_version = params[:consent_version].presence || 'reviewer-projects-v1'
          end

          ActiveRecord::Base.transaction do
            @project.update!(project_params)
            sync_brand_usages(@project, params[:brand_usage_ids]) if params.key?(:brand_usage_ids)

            ReviewerPortfolioProjectEvent.create!(
              reviewer_portfolio_project: @project,
              actor: current_user,
              action: 'updated',
              metadata: { updated_fields: project_params.keys }
            )
          end

          render json: { data: @project.as_owner_json }
        rescue ActiveRecord::StaleObjectError
          render json: { error: 'O projeto foi modificado concorrentemente. Recarregue os dados e tente novamente.' },
                 status: :conflict
        rescue ActiveRecord::RecordInvalid => e
          render json: { error: e.record.errors.full_messages }, status: :unprocessable_entity
        end

        # DELETE /api/v1/reviewer/portfolio_projects/:id
        def destroy
          old_status = @project.status
          @project.update!(status: 'disabled')

          ReviewerPortfolioProjectEvent.create!(
            reviewer_portfolio_project: @project,
            actor: current_user,
            action: 'disabled',
            old_status: old_status,
            new_status: 'disabled'
          )

          head :no_content
        end

        private

        def set_project
          @project = current_user.reviewer_portfolio_projects.find(params[:id])
        rescue ActiveRecord::RecordNotFound
          render json: { error: 'Projeto não encontrado.' }, status: :not_found
        end

        def sync_brand_usages(project, brand_usage_ids)
          return if brand_usage_ids.nil?

          # Valida ownership de cada brand_usage (impede vincular marcas de outro usuário)
          safe_ids = current_user.reviewer_brand_usages.where(id: brand_usage_ids).pluck(:id)

          if brand_usage_ids.map(&:to_s).sort != safe_ids.map(&:to_s).sort
            raise ActiveRecord::RecordInvalid.new(project), 'Marcas selecionadas inválidas ou de outro usuário.'
          end

          current_brand_usage_ids = project.brand_usages.pluck(:id)
          to_add = safe_ids - current_brand_usage_ids
          to_remove = current_brand_usage_ids - safe_ids

          project.project_brands.where(reviewer_brand_usage_id: to_remove).destroy_all if to_remove.any?

          to_add.each do |b_id|
            project.project_brands.create!(reviewer_brand_usage_id: b_id)
          end
        end

        def project_params
          params.require(:project).permit(
            :title,
            :project_type,
            :city,
            :state,
            :started_at,
            :completed_at,
            :capacity_kwp,
            :visibility,
            :description,
            :lock_version
          )
        end

        def capture_analytics(event_name, properties = {})
          return unless defined?(Analytics::PostHogService)

          distinct_id = current_user.respond_to?(:posthog_distinct_id) ? current_user.posthog_distinct_id : current_user.id.to_s
          Analytics::PostHogService.capture(event_name, properties.compact, distinct_id: distinct_id)
        rescue StandardError => e
          Rails.logger.warn("[Analytics] Falha ao capturar #{event_name}: #{e.message}")
        end
      end
    end
  end
end
