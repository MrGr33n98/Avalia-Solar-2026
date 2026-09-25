# frozen_string_literal: true

module CompanyDashboard
  class RankingReadinessService
    STEPS_COUNT = 6

    def initialize(company:)
      @company = company
    end

    def call
      items = build_items
      completed_count = items.count { |item| item[:status] == 'completed' }
      pending_item = items.find { |item| item[:status] == 'pending' }

      {
        total_steps: STEPS_COUNT,
        completed_steps: completed_count,
        completion_percentage: ((completed_count.to_f / STEPS_COUNT) * 100).round,
        is_eligible: @company.verified?,
        next_action: pending_item ? build_next_action(pending_item) : nil,
        items: items
      }
    end

    private

    def build_items
      [
        {
          id: 'profile',
          title: 'Perfil da empresa',
          description: 'Informações cadastrais essenciais e localização da sede',
          status: profile_completed? ? 'completed' : 'pending',
          action_url: "/dashboard?company_id=#{@company.id}&tab=company-info"
        },
        {
          id: 'coverage',
          title: 'Cobertura',
          description: 'Área geográfica de atuação e atendimento declarada',
          status: coverage_configured? ? 'completed' : 'pending',
          action_url: "/dashboard?company_id=#{@company.id}&tab=company-settings"
        },
        {
          id: 'verification',
          title: 'Verificação',
          description: 'Selo oficial de auditoria cadastral e documental',
          status: @company.verified? ? 'completed' : 'pending',
          action_url: "/dashboard?company_id=#{@company.id}&tab=approvals"
        },
        {
          id: 'whatsapp',
          title: 'WhatsApp',
          description: 'Canal de atendimento direto configurado e habilitado',
          status: whatsapp_operational? ? 'completed' : 'pending',
          action_url: "/dashboard?company_id=#{@company.id}&tab=company-settings"
        },
        {
          id: 'social_proof',
          title: 'Prova social',
          description: 'Exibição de depoimentos e usinas instaladas ativada',
          status: @company.social_proof_enabled? ? 'completed' : 'pending',
          action_url: "/dashboard?company_id=#{@company.id}&tab=projects"
        },
        {
          id: 'activity',
          title: '1 avaliação ou lead',
          description: 'Primeiro sinal de atividade real no mercado (avaliação ou lead)',
          status: activity_qualified? ? 'completed' : 'pending',
          action_url: "/dashboard?company_id=#{@company.id}&tab=reviews"
        }
      ]
    end

    def profile_completed?
      @company.name.present? && @company.state.present? && @company.city.present?
    end

    def coverage_configured?
      if @company.respond_to?(:company_service_areas)
        @company.company_service_areas.where(is_active: true).exists?
      else
        @company.state.present?
      end
    end

    def whatsapp_operational?
      return false unless @company.whatsapp_enabled?

      @company.cta_whatsapp_enabled? || (@company.respond_to?(:whatsapp) && @company.whatsapp.present?)
    end

    def activity_qualified?
      @company.reviews_count.to_i.positive? || @company.leads_count.to_i.positive?
    end

    def build_next_action(item)
      {
        step_id: item[:id],
        title: "Concluir #{item[:title]}",
        description: item[:description],
        action_url: item[:action_url]
      }
    end
  end
end
