module Api
  module V1
    module CompanyAdmin
      class FaqsController < BaseController
        before_action :set_faq, only: %i[update destroy]

        def index
          faqs = policy_scope(@company.company_faqs).ordered
          render json: { faqs: faqs.map { |faq| serialize_faq(faq) } }
        end

        def create
          faq = @company.company_faqs.new(faq_params)
          authorize faq
          faq.position ||= (@company.company_faqs.maximum(:position) || -1) + 1

          if faq.save
            render json: { faq: serialize_faq(faq) }, status: :created
          else
            render json: { errors: faq.errors.full_messages }, status: :unprocessable_entity
          end
        end

        def update
          authorize @faq
          if @faq.update(faq_params)
            render json: { faq: serialize_faq(@faq) }
          else
            render json: { errors: @faq.errors.full_messages }, status: :unprocessable_entity
          end
        end

        def destroy
          authorize @faq
          @faq.destroy
          head :no_content
        end

        def reorder
          faqs = policy_scope(@company.company_faqs)
          ids = Array(params[:faq_ids] || params[:ids])
          ids.each_with_index do |id, index|
            faq = faqs.find_by(id: id)
            faq&.update(position: index)
          end

          render json: { faqs: faqs.ordered.map { |faq| serialize_faq(faq) } }
        end

        private

        def set_faq
          @faq = @company.company_faqs.find(params[:id])
        end

        def faq_params
          params.require(:faq).permit(:question, :answer, :status, :position)
        end

        def serialize_faq(faq)
          faq.as_json(only: %i[id question answer status position])
        end
      end
    end
  end
end
