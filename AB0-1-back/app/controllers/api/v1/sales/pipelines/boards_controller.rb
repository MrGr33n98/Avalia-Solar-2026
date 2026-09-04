# frozen_string_literal: true

module Api
  module V1
    module Sales
      module Pipelines
        class BoardsController < BaseController
          before_action :authenticate_api_user
          before_action :require_internal_sales

          def show
            pipeline_param = params[:id] || params[:pipeline_id] || 'default'
            start_time = Process.clock_gettime(Process::CLOCK_MONOTONIC)

            board_data = ::Sales::PipelineBoard::BoardQuery.call(
              pipeline_id: pipeline_param,
              current_user: current_user,
              params: params
            )

            if board_data.nil?
              return render_error_response(
                message: 'Pipeline não encontrado',
                status: :not_found,
                code: 'PIPELINE_NOT_FOUND'
              )
            end

            payload = ::Sales::PipelineBoard::BoardPresenter.call(board_data)
            duration_ms = ((Process.clock_gettime(Process::CLOCK_MONOTONIC) - start_time) * 1000).round(2)

            Rails.logger.info(
              "[Sales::Board] sales.pipeline.board.load duration=#{duration_ms}ms cards=#{payload.dig(:totals, :total_cards)} pipeline_id=#{payload.dig(:pipeline, :id)} user_id=#{current_user.id}"
            )

            render json: payload
          end
        end
      end
    end
  end
end
