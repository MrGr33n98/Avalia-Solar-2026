# frozen_string_literal: true

module Api
  module V1
    class CompanyProjectsController < BaseController
      skip_before_action :capture_edge_location, raise: false
      before_action :set_company
      rescue_from StandardError, with: :handle_error

      def index
        return render json: { projects: [] } if @company.nil?
        return render json: { projects: [] } unless @company.respond_to?(:feature_enabled?) && @company.feature_enabled?('projects_showcase')

        projects = @company.company_projects.published.ordered
        projects = projects.where(project_type: params[:project_type]) if params[:project_type].present?
        projects = projects.where(segment: params[:segment]) if params[:segment].present?
        projects = projects.where(technology: params[:technology]) if params[:technology].present?

        render json: { projects: projects.limit(60).map { |project| serialize(project) } }
      end

      def show
        return render json: { error: 'Not found' }, status: :not_found if @company.nil?
        return render json: { error: 'Not found' }, status: :not_found unless @company.respond_to?(:feature_enabled?) && @company.feature_enabled?('projects_showcase')

        project = @company.company_projects.published.find_by!(slug: params[:id])
        render json: { project: serialize(project) }
      end

      private

      def handle_error(exception)
        Rails.logger.warn("[CompanyProjectsController] Error: #{exception.class} - #{exception.message}")
        render json: { projects: [] }
      end

      def set_company
        raw_id = params[:company_id]
        @company = Company.find_by(id: raw_id) || Company.find_by(slug: raw_id)
      end

      def serialize(project)
        assets = begin
          project.digital_assets.published.map do |asset|
            asset.as_json(only: %i[id kind title alt_text caption external_url provider position metadata]).merge(
              file_url: asset.file.attached? ? Rails.application.routes.url_helpers.rails_blob_url(asset.file, only_path: true) : nil
            )
          end
        rescue StandardError
          []
        end

        project.as_json(only: %i[id title slug summary project_type segment technology city state capacity_value capacity_unit completion_date published_at]).merge(
          assets: assets
        )
      end
    end
  end
end
