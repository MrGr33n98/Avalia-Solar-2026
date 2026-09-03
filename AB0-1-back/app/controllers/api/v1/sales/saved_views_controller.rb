# frozen_string_literal: true

module Api
  module V1
    module Sales
      class SavedViewsController < BaseController
        def index
          views = ::Sales::SavedView.for_user(current_user.id).where(resource_type: params[:resource_type].presence || 'opportunity').order(is_pinned: :desc, position: :asc, created_at: :asc)
          render json: { saved_views: views }
        end

        def create
          view = ::Sales::SavedView.create!(
            user_id: current_user.id,
            name: view_params[:name],
            resource_type: view_params[:resource_type] || 'account',
            filters: view_params[:filters] || {},
            sort: view_params[:sort] || {},
            columns: view_params[:columns] || [],
            is_shared: current_user.admin? && ActiveModel::Type::Boolean.new.cast(view_params[:is_shared])
          )
          render json: { saved_view: view }, status: :created
        end

        def pin
          view = ::Sales::SavedView.where(user_id: current_user.id).find(params[:id])
          view.update!(is_pinned: ActiveModel::Type::Boolean.new.cast(params[:pinned]))
          render json: { saved_view: view }
        end

        def update
          view = ::Sales::SavedView.where(user_id: current_user.id).find(params[:id])
          view.update!(view_params)
          render json: { saved_view: view }
        end

        def destroy
          view = ::Sales::SavedView.where(user_id: current_user.id).find(params[:id])
          view.destroy!
          render json: { message: 'Visão salva removida.' }
        end

        private

        def view_params
          params.require(:saved_view).permit(:name, :resource_type, :is_shared, :is_default, filters: {}, sort: {}, columns: [])
        end
      end
    end
  end
end
