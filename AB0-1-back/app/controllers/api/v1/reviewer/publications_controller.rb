module Api
  module V1
    module Reviewer
      class PublicationsController < BaseController
        before_action :load_publication, only: %i[show update publish archive]

        def index
          render json: current_user.reviewer_publications.order(created_at: :desc)
        end

        def show
          render json: @publication
        end

        def create
          publication = current_user.reviewer_publications.new(publication_params)
          return render json: { errors: publication.errors.full_messages }, status: :unprocessable_entity unless publication.save
          attach_files(publication)
          invalidate_creator_cache
          render json: publication, status: :created
        end

        def update
          return render json: { errors: @publication.errors.full_messages }, status: :unprocessable_entity unless @publication.update(publication_params)
          attach_files(@publication)
          invalidate_creator_cache
          render json: @publication
        end

        def publish
          @publication.update!(status: 'published', published_at: Time.current)
          invalidate_creator_cache
          render json: @publication
        end

        def archive
          @publication.update!(status: 'archived')
          invalidate_creator_cache
          render json: @publication
        end

        private

        def load_publication
          @publication = current_user.reviewer_publications.find(params[:id])
        end

        def attach_files(publication)
          publication.cover_image.attach(params[:cover_image]) if params[:cover_image].present?
          Array(params[:attachments]).first(5).each { |file| publication.attachments.attach(file) }
        end

        def invalidate_creator_cache
          Creator::PublicProfileService.invalidate(current_user.reviewer_profile)
        end

        def publication_params
          params.require(:publication).permit(:title, :slug, :excerpt, :body, :status, :publication_type, :category, :comments_enabled, :lead_capture_enabled)
        end
      end
    end
  end
end
