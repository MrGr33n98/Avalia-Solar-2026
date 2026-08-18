module Api
  module V1
    class FavoritesController < BaseController
      before_action :authenticate_api_user
      before_action :set_favorite, only: :destroy

      def index
        authorize Favorite, :index?
        scope = current_user.favorites.includes(:favoritable).order(created_at: :desc)
        type = params[:type].to_s
        if type.present?
          return unless validate_type!(type)

          scope = scope.where(favoritable_type: type)
        end
        favorites = scope.page(page_param).per(per_page_param)
        preload_favorite_items(favorites)
        render json: {
          data: favorites.map { |favorite| FavoriteSerializer.render(favorite) },
          meta: {
            total: scope.count,
            page: favorites.current_page,
            per_page: favorites.limit_value,
            by_type: current_user.favorites.group(:favoritable_type).count
          }
        }
      end

      def create
        authorize Favorite, :create?
        type = params.require(:favoritable_type).to_s
        id = params.require(:favoritable_id)
        item = find_favoritable(type, id)
        return unless item

        favorite = current_user.favorites.find_or_create_by!(favoritable: item)
        render json: FavoriteSerializer.render(favorite), status: :created
      rescue ActiveRecord::RecordNotUnique
        favorite = current_user.favorites.find_by!(favoritable_type: type, favoritable_id: id)
        render json: FavoriteSerializer.render(favorite), status: :ok
      end

      def destroy
        authorize @favorite
        @favorite.destroy!
        head :no_content
      end

      def by_item
        type = params.require(:favoritable_type).to_s
        id = params.require(:favoritable_id)
        return unless validate_type!(type)
        current_user.favorites.where(favoritable_type: type, favoritable_id: id).delete_all
        head :no_content
      end

      def status
        type = params.require(:type).to_s
        return unless validate_type!(type)
        ids = Array(params[:ids]).map(&:to_i).reject(&:zero?).uniq
        return render_error('Máximo de 100 IDs por consulta.', :unprocessable_entity, code: 'favorite_batch_too_large') if ids.size > 100

        favorites = current_user.favorites.where(favoritable_type: type, favoritable_id: ids).pluck(:favoritable_id)
        render json: { favorites: ids.index_with { |id| favorites.include?(id) } }
      end

      private

      def set_favorite
        @favorite = current_user.favorites.find(params[:id])
      end

      def find_favoritable(type, id)
        validate_type!(type)
        case type
        when 'Company' then ::Company.find(id)
        when 'Product' then ::Product.find(id)
        end
      end

      def validate_type!(type)
        return true if Favorite::ALLOWED_TYPES.include?(type)

        render_error('Tipo de favorito inválido.', :unprocessable_entity, code: 'favorite_invalid_type')
        false
      end

      def preload_favorite_items(favorites)
        products = favorites.select { |favorite| favorite.favoritable_type == 'Product' }.map(&:favoritable)
        ActiveRecord::Associations::Preloader.new(records: products, associations: %i[company categories]).call if products.any?
      end
    end
  end
end
