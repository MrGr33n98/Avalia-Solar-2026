class CorporateController < ApplicationController
  def index
    # Página inicial institucional
  end

  def login
    # Página de login corporativa
    render layout: 'application'
  end
end
