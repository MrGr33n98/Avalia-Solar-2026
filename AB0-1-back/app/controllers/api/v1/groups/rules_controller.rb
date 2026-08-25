# frozen_string_literal: true

module Api
  module V1
    module Groups
      class RulesController < BaseController
        before_action :authenticate_api_user, except: :index
        before_action :ensure_groups_enabled!
        before_action :load_group

        def index
          authorize @group, :show?
          rules = @group.group_rules.active
          render json: { data: rules.map { |rule| GroupRuleSerializer.new(rule).as_json } }
        end

        def create
          authorize @group, :moderate?

          rule = @group.group_rules.new(
            title: params[:title],
            description: params[:description],
            active: params[:active].nil? ? true : params[:active],
            position: params[:position] || 0
          )

          if rule.save
            render json: { status: 'success', data: GroupRuleSerializer.new(rule).as_json }, status: :created
          else
            render json: { error: { code: 'VALIDATION_ERROR', message: rule.errors.full_messages.join(', ') } }, status: :unprocessable_entity
          end
        end

        def update
          authorize @group, :moderate?
          rule = @group.group_rules.find(params[:id])

          rule.assign_attributes(
            title: params[:title] || rule.title,
            description: params[:description] || rule.description,
            active: params[:active].nil? ? rule.active : params[:active],
            position: params[:position] || rule.position
          )

          if rule.save
            render json: { status: 'success', data: GroupRuleSerializer.new(rule).as_json }, status: :ok
          else
            render json: { error: { code: 'VALIDATION_ERROR', message: rule.errors.full_messages.join(', ') } }, status: :unprocessable_entity
          end
        end

        def destroy
          authorize @group, :moderate?
          rule = @group.group_rules.find(params[:id])

          rule.update!(active: false)
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