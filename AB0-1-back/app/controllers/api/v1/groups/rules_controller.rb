# frozen_string_literal: true

module Api
  module V1
    module Groups
      class RulesController < BaseController
        skip_before_action :authenticate_user!, only: :index, raise: false
        before_action :ensure_groups_enabled!

        def index
          group = ::GroupPolicy::Scope.new(current_user, ::Group).resolve.find_by!(slug: params[:group_slug])
          authorize group, :show?
          rules = group.group_rules.active
          render json: { data: rules.map { |rule| GroupRuleSerializer.new(rule).as_json } }
        end

        private

        def ensure_groups_enabled!
          return if ::Groups::Feature.enabled?

          render_error_response(message: 'Comunidades indisponíveis', status: :not_found, code: 'NOT_FOUND')
          false
        end
      end
    end
  end
end