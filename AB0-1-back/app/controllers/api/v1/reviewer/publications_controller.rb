module Api
  module V1
    module Reviewer
      class PublicationsController < BaseController
        before_action :load_publication, only: %i[show update destroy publish archive]

        def index
          scope = current_user.reviewer_publications.order(created_at: :desc)
          scope = scope.where(status: params[:status]) if ReviewerPublication::STATUSES.include?(params[:status])
          scope = scope.where('title ILIKE ?', "%#{ActiveRecord::Base.sanitize_sql_like(params[:query].to_s)}%") if params[:query].present?
          render json: { items: scope.limit(100).map { |item| ReviewerPublicationSerializer.new(item).as_json }, summary: summary }
        end

        def show
          render json: ReviewerPublicationSerializer.new(@publication).as_json
        end

        def create
          publication = current_user.reviewer_publications.new(publication_params)
          publication.slug = unique_slug(publication.title)
          if publication.save
            attach_files(publication)
            render json: ReviewerPublicationSerializer.new(publication).as_json, status: :created
          else
            render json: { errors: publication.errors.full_messages }, status: :unprocessable_entity
          end
        end

        def update
          return render json: { error: 'Publicação publicada deve ser editada como rascunho.' }, status: :unprocessable_entity if @publication.published?
          if @publication.update(publication_params)
            attach_files(@publication)
            render json: ReviewerPublicationSerializer.new(@publication).as_json
          else
            render json: { errors: @publication.errors.full_messages }, status: :unprocessable_entity
          end
        end

        def publish
          @publication.publish!
          ReviewerPublicationEvent.create!(reviewer_publication: @publication, user: current_user, event_name: 'publication_publish')
          render json: ReviewerPublicationSerializer.new(@publication).as_json
        rescue ActiveRecord::RecordInvalid => e
          render json: { errors: e.record.errors.full_messages }, status: :unprocessable_entity
        end

        def archive
          @publication.archive!
          render json: ReviewerPublicationSerializer.new(@publication).as_json
        end

        def destroy
          return render json: { error: 'Somente rascunhos podem ser excluídos.' }, status: :unprocessable_entity unless @publication.draft?
          @publication.destroy!
          head :no_content
        end

        private

        def load_publication
          @publication = current_user.reviewer_publications.find(params[:id])
        end

        def attach_files(publication)
          if params[:cover_image].present? && %w[image/jpeg image/png image/webp].include?(params[:cover_image].content_type) && params[:cover_image].size <= 8.megabytes
            publication.cover_image.attach(params[:cover_image])
          end
          Array(params[:attachments]).first(5).each do |file|
            publication.attachments.attach(file) if file.respond_to?(:content_type) && file.size <= 10.megabytes
          end
        end

        def publication_params
          params.require(:publication).permit(:title, :excerpt, :body, :publication_type, :category, :comments_enabled, :lead_capture_enabled)
        end

        def unique_slug(title)
          base = title.to_s.parameterize.presence || 'publicacao'
          slug = base
          suffix = 2
          while current_user.reviewer_publications.exists?(slug: slug)
            slug = "#{base}-#{suffix}"
            suffix += 1
          end
          slug
        end

        def summary
          current_user.reviewer_publications.group(:status).count
        end
      end
    end
  end
end
