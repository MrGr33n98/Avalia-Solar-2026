module Api
  module V1
    module Sales
      class ApiKeysController < BaseController
        def index
          keys = ::Sales::ApiKey.where(user: current_user, revoked_at: nil).order(created_at: :desc)
          render json: { api_keys: keys.map { |key| serialize(key) } }
        end

        def create
          name_param = params[:name].presence || params.dig(:api_key, :name)
          raise ActionController::ParameterMissing, :name if name_param.blank?

          key, raw = ::Sales::ApiKey.issue!(
            user: current_user,
            name: name_param,
            scopes: Array(params[:scopes] || params.dig(:api_key, :scopes)),
            company: current_user.company
          )
          render json: { api_key: serialize(key).merge(secret: raw, token: raw) }, status: :created
        end

        def destroy
          key = ::Sales::ApiKey.where(user: current_user).find(params[:id])
          key.update!(revoked_at: Time.current)
          head :no_content
        end

        private

        def serialize(key)
          { id: key.id, name: key.name, key_prefix: key.key_prefix, scopes: key.scopes,
            last_used_at: key.last_used_at, revoked_at: key.revoked_at, created_at: key.created_at }
        end
      end
    end
  end
end
