# frozen_string_literal: true

class GraphqlController < ApplicationController
  # Skip CSRF para requisições GraphQL (API pura)
  skip_before_action :verify_authenticity_token

  def execute
    variables = prepare_variables(params[:variables])
    query = params[:query]
    operation_name = params[:operationName]

    context = {
      current_user: current_user_from_token,
      request: request
    }

    result = AvaliaSolarSchema.execute(
      query,
      variables: variables,
      context: context,
      operation_name: operation_name
    )

    render json: result
  rescue StandardError => e
    raise e unless Rails.env.development?

    handle_error_in_development(e)
  end

  private

  # Extrai current_user via JWT Bearer Token (mesmo mecanismo do REST)
  def current_user_from_token
    header = request.headers['Authorization']
    return nil if header.blank?

    token = header.split.last
    decoded = jwt_decode(token)
    return nil if decoded.nil?

    User.find_by(id: decoded[:user_id])
  rescue StandardError
    nil
  end

  def jwt_decode(token)
    JWT.decode(
      token,
      Rails.application.secret_key_base,
      true,
      algorithm: 'HS256'
    ).first.with_indifferent_access
  rescue JWT::DecodeError
    nil
  end

  # Prepara variáveis recebidas em diferentes formatos (string JSON ou hash)
  def prepare_variables(variables_param)
    case variables_param
    when String
      if variables_param.present?
        JSON.parse(variables_param) || {}
      else
        {}
      end
    when Hash
      variables_param
    when ActionController::Parameters
      variables_param.to_unsafe_hash
    when nil
      {}
    else
      raise ArgumentError, "Unexpected parameter: #{variables_param}"
    end
  end

  def handle_error_in_development(err)
    logger.error err.message
    logger.error err.backtrace.join("\n")

    render json: {
      errors: [{ message: err.message, backtrace: err.backtrace }],
      data: {}
    }, status: :internal_server_error
  end
end
