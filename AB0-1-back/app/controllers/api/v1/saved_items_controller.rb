# frozen_string_literal: true

module Api
  module V1
    class SavedItemsController < BaseController
      before_action :authenticate_user!

      def index
        authorize SavedItem

        saved_items = current_user.saved_items.includes(:saveable)
        serialized = saved_items.map do |si|
          {
            id: si.id,
            saveable_type: si.saveable_type.underscore,
            saveable_id: si.saveable_id,
            created_at: si.created_at.iso8601
          }
        end

        render json: { data: serialized }
      end

      def create
        authorize SavedItem

        saveable = find_saveable
        unless saveable
          return render json: { error: { code: 'NOT_FOUND', message: 'Item não encontrado' } }, status: :not_found
        end

        saved_item = SavedItem.find_or_create_by!(user: current_user, saveable: saveable)
        render json: { status: 'success', data: saved_item }, status: :ok
      end

      def destroy
        authorize SavedItem

        saveable = find_saveable
        if saveable
          SavedItem.where(user: current_user, saveable: saveable).destroy_all
        end

        render json: { status: 'success' }, status: :ok
      end

      private

      def find_saveable
        type = params[:saveable_type]
        id = params[:saveable_id]

        case type
        when 'ReviewerPublication' then ReviewerPublication.find_by(id: id)
        when 'Review' then Review.find_by(id: id)
        when 'Company' then Company.find_by(id: id)
        when 'Product' then Product.find_by(id: id)
        else nil
        end
      end
    end
  end
end
