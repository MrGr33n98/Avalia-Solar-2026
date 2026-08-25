# frozen_string_literal: true

module Api
  module V1
    module Groups
      class TopicsController < BaseController
        before_action :authenticate_api_user, except: :index
        before_action :ensure_groups_enabled!
        before_action :load_group

        def index
          authorize @group, :show?
          topics = @group.group_topics.active
          render json: { data: topics.map { |topic| GroupTopicSerializer.new(topic).as_json } }
        end

        def create
          authorize @group, :moderate?

          slug = params[:slug].presence || params[:name].to_s.parameterize
          topic = @group.group_topics.new(
            name: params[:name],
            slug: slug,
            active: params[:active].nil? ? true : params[:active],
            position: params[:position] || 0
          )

          if topic.save
            render json: { status: 'success', data: GroupTopicSerializer.new(topic).as_json }, status: :created
          else
            render json: { error: { code: 'VALIDATION_ERROR', message: topic.errors.full_messages.join(', ') } }, status: :unprocessable_entity
          end
        end

        def update
          authorize @group, :moderate?
          topic = @group.group_topics.find(params[:id])

          slug = params[:slug].presence || (params[:name].present? ? params[:name].to_s.parameterize : nil)
          topic.assign_attributes(
            name: params[:name] || topic.name,
            slug: slug || topic.slug,
            active: params[:active].nil? ? topic.active : params[:active],
            position: params[:position] || topic.position
          )

          if topic.save
            render json: { status: 'success', data: GroupTopicSerializer.new(topic).as_json }, status: :ok
          else
            render json: { error: { code: 'VALIDATION_ERROR', message: topic.errors.full_messages.join(', ') } }, status: :unprocessable_entity
          end
        end

        def destroy
          authorize @group, :moderate?
          topic = @group.group_topics.find(params[:id])

          topic.update!(active: false)
          render json: { status: 'success' }, status: :ok
        end

        private

        def ensure_groups_enabled!
          return if ::Groups::Feature.enabled?

          render_error_response(message: 'Comunidades indisponíveis', status: :not_found, code: 'NOT_FOUND')
          false
        end

        def load_group
          @group = ::GroupPolicy::Scope.new(current_user, ::Group).resolve.find_by!(slug: params[:group_slug])
        end
      end
    end
  end
end