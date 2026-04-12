module App
  class BaseController < ApplicationController
    layout 'app'

    before_action :set_current_company

    private

    def set_current_company
      @current_app_company = current_user&.company
    end
  end
end
