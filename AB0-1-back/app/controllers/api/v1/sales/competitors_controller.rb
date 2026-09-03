# frozen_string_literal: true

module Api
  module V1
    module Sales
      class CompetitorsController < BaseController
        def index
          competitors = ::Sales::Competitor.active.order(:name)
          render json: { competitors: competitors.map { |c| { id: c.id, name: c.name, website: c.website } } }
        end

        def create
          competitor = ::Sales::Competitor.new(params.require(:competitor).permit(:name, :website))
          if competitor.save
            render json: { competitor: { id: competitor.id, name: competitor.name, website: competitor.website } }, status: :created
          else
            render json: { error: { code: 'VALIDATION_ERROR', message: competitor.errors.full_messages.join(', ') } }, status: :unprocessable_entity
          end
        end
      end
    end
  end
end
