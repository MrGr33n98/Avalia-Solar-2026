module App
  class BaseController < ApplicationController
    layout 'app'
    include App::UiHelper

    before_action :authenticate_user!
    before_action :set_current_company

    private

    def set_current_company
      @current_app_company = current_user&.company
    end
  end
end
