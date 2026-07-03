# frozen_string_literal: true

class ApiRootController < ActionController::API
  def show
    response.set_header('X-Robots-Tag', 'noindex, nofollow, noarchive')
    render json: {
      service: 'Avalia Solar API',
      status: 'ok'
    }
  end
end
