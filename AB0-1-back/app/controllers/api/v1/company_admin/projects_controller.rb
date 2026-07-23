# frozen_string_literal: true

module Api
  module V1
    module CompanyAdmin
      class ProjectsController < BaseController
        before_action -> { require_company_feature!('projects_showcase') }
        before_action :set_project, only: %i[show update destroy submit]

        def index
          authorize CompanyProject.new(company: @company), :index?
          render json: { projects: policy_scope(@company.company_projects).ordered.map { |project| serialize(project) } }
        end

        def show
          authorize @project
          render json: { project: serialize(@project) }
        end

        def create
          project = @company.company_projects.new(project_params)
          authorize project
          return render json: { errors: project.errors.full_messages }, status: :unprocessable_entity unless project.save

          render json: { project: serialize(project) }, status: :created
        end

        def update
          authorize @project
          was_published = @project.status == 'published'
          return render json: { errors: @project.errors.full_messages }, status: :unprocessable_entity unless @project.update(project_params)

          @project.update!(status: 'pending', published_at: nil, moderation_reason: nil) if was_published

          render json: { project: serialize(@project) }
        end

        def destroy
          authorize @project
          @project.update!(status: 'archived')
          head :no_content
        end

        def submit
          authorize @project, :submit?
          @project.update!(status: 'pending', moderation_reason: nil)
          render json: { project: serialize(@project) }
        end

        private

        def set_project
          @project = @company.company_projects.find(params[:id])
        end

        def project_params
          params.require(:project).permit(
            :title, :slug, :summary, :project_type, :segment, :technology, :city, :state,
            :capacity_value, :capacity_unit, :completion_date, :position
          )
        end

        def serialize(project)
          project.as_json(only: %i[id title slug summary project_type segment technology city state capacity_value capacity_unit completion_date status published_at position moderation_reason created_at updated_at]).merge(
            assets: project.digital_assets.order(position: :asc, created_at: :asc).map { |asset| asset_payload(asset) }
          )
        end

        def asset_payload(asset)
          asset.as_json(only: %i[id kind title alt_text caption external_url provider status processing_status position metadata])
        end
      end
    end
  end
end
