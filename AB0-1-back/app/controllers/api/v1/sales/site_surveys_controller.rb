# frozen_string_literal: true

module Api
  module V1
    module Sales
      class SiteSurveysController < BaseController
        def create
          project = accessible_projects.find(params[:solar_project_id])
          survey = project.site_surveys.create!(survey_params.merge(inspector: current_user))
          render json: { site_survey: serialize(survey) }, status: :created
        end

        def update
          survey = accessible_surveys.find(params[:id])
          survey.update!(survey_params)
          render json: { site_survey: serialize(survey) }
        end

        private

        def survey_params
          params.require(:site_survey).permit(:status, :visited_at, :roof_area_m2, :roof_pitch_degrees,
                                              :roof_material, :shading_level, :connection_voltage, :observations,
                                              photos: [])
        end

        def accessible_projects
          return ::Sales::SolarProject.all if current_user.admin?

          ::Sales::SolarProject.joins(:account).where(sales_accounts: { owner_id: current_user.id })
        end

        def accessible_surveys
          return ::Sales::SolarSiteSurvey.all if current_user.admin?

          ::Sales::SolarSiteSurvey.joins(solar_project: :account)
                                 .where(sales_accounts: { owner_id: current_user.id })
        end

        def serialize(survey)
          survey.attributes.slice('id', 'solar_project_id', 'inspector_id', 'status', 'visited_at', 'roof_area_m2',
                                  'roof_pitch_degrees', 'roof_material', 'shading_level', 'connection_voltage',
                                  'observations', 'photos', 'created_at', 'updated_at')
        end
      end
    end
  end
end
