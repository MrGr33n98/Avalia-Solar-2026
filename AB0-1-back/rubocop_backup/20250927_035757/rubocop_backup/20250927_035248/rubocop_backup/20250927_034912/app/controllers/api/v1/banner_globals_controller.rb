class Api::V1::BannerGlobalsController < ApplicationController
  include Rails.application.routes.url_helpers

  def index
    banners = BannerGlobal.all.order(created_at: :desc)
    banners_with_images = banners.select { |b| b.image.attached? }.map do |b|
      b.as_json.merge(image_url: url_for(b.image))
    end
    render json: banners_with_images
  end
end
