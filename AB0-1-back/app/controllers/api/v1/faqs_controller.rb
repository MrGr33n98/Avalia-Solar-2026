# frozen_string_literal: true

class Api::V1::FaqsController < Api::V1::BaseController
  before_action :authenticate_api_user, except: %i[index vote view]
  before_action :set_faq, only: %i[show update destroy vote view]
  before_action :require_admin, only: %i[create update destroy]

  # GET /api/v1/faqs
  def index
    faqs = Faq.active
              .by_category(params[:category])
              .search(params[:q])
              .ordered

    faqs = faqs.limit(per_page).offset(offset)

    render json: {
      faqs: faqs.as_json(only: %i[id question answer category position active],
                         methods: %i[helpful_total helpful_yes helpful_no]),
      pagination: pagination_meta(faqs)
    }
  end

  # POST /api/v1/faqs
  def create
    faq = Faq.new(faq_params)
    faq.save!
    render json: { faq: faq }, status: :created
  end

  # PUT /api/v1/faqs/:id
  def update
    @faq.update!(faq_params)
    render json: { faq: @faq }
  end

  # DELETE /api/v1/faqs/:id
  def destroy
    @faq.destroy
    head :no_content
  end

  # POST /api/v1/faqs/:id/view
  def view
    if @faq.respond_to?(:views_count)
      @faq.class.increment_counter(:views_count, @faq.id)
      @faq.reload
    end
    render json: { success: true, views_count: @faq.try(:views_count) || 0 }
  end

  # POST /api/v1/faqs/:id/vote
  def vote
    vote_value = params[:helpful].to_s == 'true'
    if vote_value
      @faq.increment!(:helpful_yes) if @faq.respond_to?(:helpful_yes)
    elsif @faq.respond_to?(:helpful_no)
      @faq.increment!(:helpful_no)
    end

    render json: {
      faq: @faq.as_json(
        only: %i[id question answer status position views_count helpful_yes helpful_no],
        methods: %i[helpful_total]
      )
    }
  end

  private

  def set_faq
    if params[:is_company].to_s == 'true' || params[:type] == 'company'
      @faq = CompanyFaq.find(params[:id])
    else
      @faq = Faq.find_by(id: params[:id]) || CompanyFaq.find_by(id: params[:id]) || Faq.find(params[:id])
    end
  end

  def faq_params
    params.require(:faq).permit(:question, :answer, :category, :position, :active)
  end

  def per_page
    [(params[:per_page] || 20).to_i, 50].min
  end

  def offset
    page = [(params[:page] || 1).to_i, 1].max
    (page - 1) * per_page
  end

  def pagination_meta(collection)
    {
      count: collection.size,
      page: (params[:page] || 1).to_i,
      per_page: per_page
    }
  end
end
