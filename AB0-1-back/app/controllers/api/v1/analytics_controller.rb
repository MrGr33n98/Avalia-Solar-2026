class Api::V1::AnalyticsController < Api::V1::BaseController
  def track
    event = params[:event]
    data = params[:data]

    # Aqui você pode implementar a lógica para armazenar ou processar o evento
    # Por exemplo, salvar em um banco de dados, enviar para um serviço externo, etc.

    if event.present?
      # Exemplo simples: apenas logar o evento
      Rails.logger.info("Evento de analytics recebido: #{event} com dados: #{data}")
      render json: { status: 'success', message: 'Evento registrado com sucesso' }
    else
      render json: { status: 'error', message: 'Evento não especificado' }, status: :bad_request
    end
  end
end