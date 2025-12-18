module Api
  module V1
    class FinancingOptionsController < ApplicationController
      before_action :set_company
      before_action :set_financing_option, only: [:update, :destroy]

      def index
        options = @company.financing_options
        options = options.where(target_audience: params[:audience]) if params[:audience].present?
        options = options.active_only if ActiveModel::Type::Boolean.new.cast(params[:active])
        render json: options.map { |o| FinancingOptionSerializer.new(o).as_json }
      end

      def create
        option = @company.financing_options.new(financing_option_params)
        if option.save
          render json: FinancingOptionSerializer.new(option).as_json, status: :created
        else
          render json: { error: option.errors.full_messages.join(', ') }, status: :unprocessable_entity
        end
      end

      def update
        if @financing_option.update(financing_option_params)
          render json: FinancingOptionSerializer.new(@financing_option).as_json
        else
          render json: { error: @financing_option.errors.full_messages.join(', ') }, status: :unprocessable_entity
        end
      end

      def destroy
        @financing_option.destroy
        head :no_content
      end

      def compare
        ids = Array(params[:ids]).map(&:to_i).uniq
        options = @company.financing_options.where(id: ids)
        sorted = options.sort_by { |o| [(o.interest_rate_percent || Float::INFINITY), -(o.max_term_months || 0)] }
        render json: { options: sorted.map { |o| FinancingOptionSerializer.new(o).as_json } }
      end

      private

      def set_company
        @company = Company.find(params[:company_id])
      end

      def set_financing_option
        @financing_option = @company.financing_options.find(params[:id])
      end

      def financing_option_params
        params.require(:financing_option).permit(
          :institution_name, :credit_line, :target_audience,
          :max_term_months, :grace_period_months,
          :interest_rate_percent, :interest_rate_details,
          :active, :service_filters, :project_filters, :category_filters
        )
      end
    end
  end
end