class Api::V1::BannersController < ApplicationController
  def index
    banners = Banner.where(active: true)
    render json: banners
  end
end
