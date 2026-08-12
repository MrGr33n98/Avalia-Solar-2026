# frozen_string_literal: true

class Api::V1::PublicidadeCampanhasController < Api::V1::BaseController
  skip_before_action :authenticate_user!, raise: false

  def index
    @campaign = Rails.cache.fetch("publicidade:campanha_ativa", expires_in: 10.minutes) do
      active = Campaign.active_campaign
      if active
        {
          id: active.id,
          name: active.name,
          description: active.description,
          target_url: active.target_url,
          budget: active.budget.to_f,
          company: active.company ? { id: active.company.id, name: active.company.name } : nil,
          image_url: active.image_url
        }
      else
        nil
      end
    end

    if @campaign
      render json: @campaign
    else
      # Se não houver campanha ativa, retorna vazio de forma limpa
      render json: nil, status: :ok
    end
  end
end
