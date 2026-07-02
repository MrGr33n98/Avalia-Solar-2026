# frozen_string_literal: true

module Mcp
  class NextActionsService < BaseService
    def call
      company = authorized_company!
      stats = CompanyDashboard::StatsService.new(company).call
      actions = []
      actions << action('reply_reviews', 'Responder avaliações pendentes', 'high', stats[:pending_reviews_count]) if stats[:pending_reviews_count].to_i.positive?
      actions << action('request_reviews', 'Solicitar novas avaliações', 'medium', stats[:reviews_count]) if stats[:reviews_count].to_i < 10
      actions << action('follow_up_leads', 'Fazer follow-up dos leads recentes', 'high', stats[:leads_30d]) if stats[:leads_30d].to_i.positive?
      actions << action('improve_profile', 'Completar e atualizar o perfil público', 'medium', nil) if company.description.blank? || company.logo_url.blank?
      actions << action('monitor_performance', 'Acompanhar conversão e reputação', 'low', nil) if actions.empty?

      { company: { id: company.id, name: company.name }, actions: actions.first(5), generated_from: 'platform_metrics' }
    end

    private

    def action(code, title, priority, current_value)
      { code: code, title: title, priority: priority, current_value: current_value }
    end
  end
end
