# frozen_string_literal: true

module Api
  module V1
    module Reviewer
      class TreeSettingsController < BaseController
        before_action :authenticate_api_user
        before_action :require_reviewer_role

        def show
          settings = current_profile.creator_tree_setting || current_profile.create_creator_tree_setting!
          render json: settings.as_json(only: %i[theme_key appearance config])
        end

        def update
          settings = current_profile.creator_tree_setting || current_profile.build_creator_tree_setting

          if settings.update(settings_params)
            render json: settings.as_json(only: %i[theme_key appearance config])
          else
            render json: {
              error: {
                code: 'validation_failed',
                message: 'Não foi possível salvar as configurações do Tree.',
                fields: settings.errors.to_hash
              }
            }, status: :unprocessable_entity
          end
        end

        def upload_background_image
          settings = current_profile.creator_tree_setting || current_profile.build_creator_tree_setting
          
          if params[:image].present?
            settings.background_image.attach(params[:image])
            
            if settings.save
              image_url = url_for(settings.background_image)
              render json: { url: image_url }
            else
              render json: { error: 'Não foi possível salvar a imagem' }, status: :unprocessable_entity
            end
          else
            render json: { error: 'Nenhuma imagem enviada' }, status: :bad_request
          end
        end

        private

        def current_profile
          @current_profile ||= current_user.reviewer_profile || current_user.create_reviewer_profile!
        end

        def settings_params
          params.require(:settings).permit(:theme_key).tap do |whitelisted|
            whitelisted[:appearance] = params[:settings][:appearance] if params[:settings].key?(:appearance)
            whitelisted[:config] = params[:settings][:config] if params[:settings].key?(:config)
          end
        end

        def require_reviewer_role
          return if current_user&.review_user?

          render json: { error: 'Acesso restrito a creators.' }, status: :forbidden
        end
      end
    end
  end
end
