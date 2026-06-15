# frozen_string_literal: true

# app/graphql/avalia_solar_schema.rb
class AvaliaSolarSchema < GraphQL::Schema
  mutation(Types::MutationType) unless mutation
  query(Types::QueryType) unless query

  # ─────────────────────────────────────────────
  # Segurança: limites de profundidade e complexidade
  # ─────────────────────────────────────────────
  max_depth 7
  max_complexity 5000
  default_max_page_size 100

  # Desabilita introspection em produção para evitar exposição do schema
  disable_introspection_entry_points if Rails.env.production?

  # ─────────────────────────────────────────────
  # Tratamento de erros
  # ─────────────────────────────────────────────
  rescue_from(ActiveRecord::RecordNotFound) do |err, _obj, _args, _ctx, _field|
    raise GraphQL::ExecutionError, "Registro não encontrado: #{err.message}"
  end

  rescue_from(ActiveRecord::RecordInvalid) do |err, _obj, _args, _ctx, _field|
    raise GraphQL::ExecutionError, "Dados inválidos: #{err.record.errors.full_messages.join(', ')}"
  end

  rescue_from(Pundit::NotAuthorizedError) do |_err, _obj, _args, _ctx, _field|
    raise GraphQL::ExecutionError, 'Não autorizado'
  end

  # Logs de queries em desenvolvimento
  trace_with GraphQL::Tracing::ActiveSupportNotificationsTrace if Rails.env.development?
end
