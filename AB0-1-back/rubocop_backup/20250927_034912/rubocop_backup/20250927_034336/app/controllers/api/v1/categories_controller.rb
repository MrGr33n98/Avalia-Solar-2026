# app/controllers/api/v1/categories_controller.rb
module Api
  module V1
    class CategoriesController < Api::V1::BaseController
      before_action :set_category, only: %i[show update destroy]

      # =========================
      # GET /categories
      # =========================
      def index
        query = Category.all

        # Filtrar por status (só se a coluna existir)
        if Category.column_names.include?('status') && params[:status].present?
          query = query.where(status: params[:status])
        end

        # Filtrar por featured (só se a coluna existir)
        if Category.column_names.include?('featured') && params[:featured].present?
          featured = ActiveModel::Type::Boolean.new.cast(params[:featured])
          query = query.where(featured: featured)
        end

        # Aplicar limite (ignora se for <= 0)
        query = query.limit(params[:limit].to_i) if params[:limit].present? && params[:limit].to_i.positive?

        # Inclui companies apenas se associação existir
        query = query.includes(:companies) if Category.reflect_on_association(:companies)

        @categories = query

        # Use the as_json method from the Category model which includes banner_url
        render json: @categories.map(&:as_json)
      rescue ActiveRecord::RecordNotFound => e
        Rails.logger.error("Categories not found: #{e.message}")
        render json: { error: 'Categorias não encontradas' }, status: :not_found
      rescue StandardError => e
        Rails.logger.error("Categories error: #{e.message}\n#{e.backtrace.take(5).join("\n")}")
        render json: { error: 'Erro interno no servidor', details: e.message }, status: :internal_server_error
      end

      # =========================
      # GET /categories/:id
      # =========================
      def show
        render json: @category.as_json
      rescue ActiveRecord::RecordNotFound
        render json: { error: 'Categoria não encontrada' }, status: :not_found
      rescue StandardError => e
        Rails.logger.error("Categories#show error: #{e.message}")
        render json: { error: 'Erro interno no servidor' }, status: :internal_server_error
      end

      # =========================
      # POST /categories
      # =========================
      def create
        @category = Category.new(category_params)

        if @category.save
          render json: @category.as_json(
            only: %i[id name seo_url seo_title short_description description status featured]
          ), status: :created
        else
          render json: { errors: @category.errors.full_messages }, status: :unprocessable_entity
        end
      rescue StandardError => e
        Rails.logger.error("Categories#create error: #{e.message}")
        render json: { error: 'Erro interno no servidor' }, status: :internal_server_error
      end

      # =========================
      # PUT/PATCH /categories/:id
      # =========================
      def update
        if @category.update(category_params)
          render json: @category.as_json(
            only: %i[id name seo_url seo_title short_description description status featured]
          )
        else
          render json: { errors: @category.errors.full_messages }, status: :unprocessable_entity
        end
      rescue ActiveRecord::RecordNotFound
        render json: { error: 'Categoria não encontrada' }, status: :not_found
      rescue StandardError => e
        Rails.logger.error("Categories#update error: #{e.message}")
        render json: { error: 'Erro interno no servidor' }, status: :internal_server_error
      end

      # =========================
      # DELETE /categories/:id
      # =========================
      def destroy
        @category.destroy
        render json: { message: 'Categoria excluída' }, status: :ok
      rescue ActiveRecord::RecordNotFound
        render json: { error: 'Categoria não encontrada' }, status: :not_found
      rescue StandardError => e
        Rails.logger.error("Categories#destroy error: #{e.message}")
        render json: { error: 'Erro interno no servidor' }, status: :internal_server_error
      end

      private

      def set_category
        @category = Category.find(params[:id])
      end

      def category_params
        params.require(:category).permit(
          :name, :seo_url, :seo_title, :short_description,
          :description, :parent_id, :kind, :status, :featured
        )
      end
    end
  end
end
