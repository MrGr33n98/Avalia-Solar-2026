# frozen_string_literal: true

module Chat
  class DashboardKnowledgeRegistry
    Entry = Struct.new(:feature_key, :title, :route_key, :description, :help_text, :required_entitlement, :last_updated, keyword_init: true)

    ENTRIES = [
      Entry.new(feature_key: 'categories', title: 'Categorias', route_key: 'product-categories', description: 'Segmentos atendidos pela empresa.', help_text: 'Adicione categorias dentro do limite retornado pelo backend.', required_entitlement: 'company_categories_limit', last_updated: '2026-08-12'),
      Entry.new(feature_key: 'company_profile', title: 'Perfil da empresa', route_key: 'product-general', description: 'Dados públicos, contato e descrição.', help_text: 'Atualize dados conforme a política de governança.', required_entitlement: nil, last_updated: '2026-08-12'),
      Entry.new(feature_key: 'live_inbox', title: 'Live Inbox de Leads MobiVolt', route_key: 'live-inbox', description: 'Atendimento de oportunidades qualificadas.', help_text: 'Disponível conforme entitlement ai_live_inbox.', required_entitlement: 'ai_live_inbox', last_updated: '2026-08-12'),
      Entry.new(feature_key: 'health', title: 'Saúde da empresa', route_key: 'overview', description: 'Score e dimensões de qualidade do perfil.', help_text: 'Consulte Health e Next Best Actions no Overview.', required_entitlement: nil, last_updated: '2026-08-12')
    ].freeze

    def self.find(feature_key)
      ENTRIES.find { |entry| entry.feature_key == feature_key.to_s }
    end

    def self.all
      ENTRIES
    end
  end
end
