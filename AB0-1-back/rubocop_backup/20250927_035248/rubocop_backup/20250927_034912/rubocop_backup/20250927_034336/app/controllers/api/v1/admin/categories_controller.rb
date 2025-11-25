require 'English'
require 'csv'

module Api
  module V1
    module Admin
      class CategoriesController < ApplicationController
        # Remove the problematic skip_before_action
        # skip_before_action :verify_authenticity_token

        before_action :set_category, only: %i[show update destroy]

        def index
          @categories = Category.all
          render json: @categories
        end

        def show
          render json: @category
        end

        def create
          @category = Category.new(category_params)

          if @category.save
            render json: @category, status: :created
          else
            render json: { errors: @category.errors.full_messages }, status: :unprocessable_entity
          end
        end

        def update
          if @category.update(category_params)
            render json: @category
          else
            render json: { errors: @category.errors.full_messages }, status: :unprocessable_entity
          end
        end

        def destroy
          @category.destroy
          render json: { message: 'Category deleted successfully' }, status: :ok
        end

        private

        def set_category
          @category = Category.find(params[:id])
        end

        def category_params
          params.require(:category).permit(:name, :seo_url, :seo_title, :short_description, :description, :parent_id,
                                           :kind, :status, :featured)
        end
      end
    end
  end
end

def import
  if params[:file].nil?
    render json: { error: 'No file uploaded' }, status: :bad_request
    return
  end

  success_count = 0
  errors = []

  begin
    CSV.foreach(params[:file].path, headers: true) do |row|
      category = Category.new(
        name: row['name'],
        seo_url: row['seo_url'] || row['name'].parameterize,
        seo_title: row['seo_title'],
        short_description: row['short_description'],
        description: row['description'],
        parent_id: row['parent_id'].present? ? row['parent_id'] : nil,
        kind: row['kind'] || 'product',
        status: row['status'] || 'active',
        featured: row['featured'] == 'true'
      )

      if category.save
        success_count += 1
      else
        errors << "Row #{$INPUT_LINE_NUMBER + 1}: #{category.errors.full_messages.join(', ')}"
      end
    end

    render json: {
      message: "Import completed: #{success_count} categories created successfully",
      errors: errors
    }, status: errors.empty? ? :ok : :partial_content
  rescue StandardError => e
    render json: { error: "Import failed: #{e.message}" }, status: :unprocessable_entity
  end
end
