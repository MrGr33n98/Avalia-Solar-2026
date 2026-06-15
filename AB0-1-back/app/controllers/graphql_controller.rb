# frozen_string_literal: true

class GraphqlController < ApplicationController
  # Skip CSRF para requisições GraphQL (API pura)
  skip_before_action :verify_authenticity_token

  def execute
    variables = prepare_variables(params[:variables])
    query = params[:query]
    operation_name = params[:operationName]

    # Suporte a APQ (Automatic Persisted Queries)
    extensions = prepare_extensions(params[:extensions])
    if extensions.present? && extensions.dig('persistedQuery', 'version') == 1
      sha256_hash = extensions.dig('persistedQuery', 'sha256Hash')
      if sha256_hash.present?
        if query.blank?
          # Tentamos buscar do cache
          query = read_persisted_query(sha256_hash)
          if query.blank?
            render json: {
              errors: [
                {
                  message: 'PersistedQueryNotFound',
                  extensions: { code: 'PERSISTED_QUERY_NOT_FOUND' }
                }
              ]
            }
            return
          end
        else
          # Query fornecida, vamos persistir
          write_persisted_query(sha256_hash, query)
        end
      end
    end

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

  def prepare_extensions(extensions_param)
    case extensions_param
    when String
      if extensions_param.present?
        JSON.parse(extensions_param) || {}
      else
        {}
      end
    when Hash
      extensions_param
    when ActionController::Parameters
      extensions_param.to_unsafe_hash
    when nil
      {}
    else
      {}
    end
  rescue JSON::ParserError
    {}
  end

  def read_persisted_query(hash)
    return nil if REDIS.is_a?(NullRedis) || !defined?(REDIS)

    begin
      REDIS.get("apq:#{hash}")
    rescue => e
      Rails.logger.error "[APQ] Erro ao ler hash do Redis: #{e.message}"
      nil
    end
  end

  def write_persisted_query(hash, query)
    return if REDIS.is_a?(NullRedis) || !defined?(REDIS)

    begin
      REDIS.setex("apq:#{hash}", 24.hours.to_i, query)
    rescue => e
      Rails.logger.error "[APQ] Erro ao gravar hash no Redis: #{e.message}"
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
