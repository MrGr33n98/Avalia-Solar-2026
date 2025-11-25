# frozen_string_literal: true
class Api::V1::ContentFeedController < Api::V1::BaseController
  def index
    feed = ContentFeedService.new(
      company_id: params[:company_id],
      category_id: params[:category_id],
      limit: params.fetch(:limit, 20),
      sponsored_interval: params.fetch(:sponsored_interval, 4)
    ).build

    render json: feed.map { |item| serialize_item(item) }
  rescue StandardError => e
    Rails.logger.error("ContentFeed#index error: #{e.message}")
    render json: { error: 'Erro interno no servidor' }, status: :internal_server_error
  end

  private

  def serialize_item(item)
    case item
    when Article
      ArticleSerializer.new(item).as_json.merge(type: 'article')
    when CampaignReview
      CampaignReviewSerializer.new(item).as_json.merge(type: 'campaign_review')
    else
      { id: item.id, type: item.class.name }
    end
  end
end
