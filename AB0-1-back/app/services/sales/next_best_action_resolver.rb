module Sales
  class NextBestActionResolver
    def self.resolve(account)
      new(account).resolve
    end

    def initialize(account)
      @account = account
      @contacts = account.contacts
      @opportunities = account.opportunities.open
      @company = account.company
    end

    def resolve
      # Rule 1: Open opportunity with no future task or next activity
      opp_no_action = @opportunities.find { |o| o.next_activity_at.blank? && o.tasks.pending.none? }
      if opp_no_action.present?
        return {
          action_type: 'define_next_action',
          priority: 'high',
          title: "Agendar próxima ação para a Oportunidade \"#{opp_no_action.name}\"",
          reason: 'Oportunidades em aberto sem próxima ação agendada possuem risco alto de estagnação.',
          entity_type: 'Sales::Opportunity',
          entity_id: opp_no_action.id
        }
      end

      # Rule 2: Account with no contacts
      if @contacts.empty?
        return {
          action_type: 'identify_decision_maker',
          priority: 'high',
          title: 'Mapear Decisor Comercial (CEO ou Diretor)',
          reason: 'Empresas sem contatos mapeados não podem receber abordagem de vendas qualificada.',
          entity_type: 'Sales::Account',
          entity_id: @account.id
        }
      end

      # Rule 3: High rating profile unclaimed in marketplace
      if @company.present? && !@company.try(:verified) && @company.try(:rating_avg).to_f >= 4.0
        return {
          action_type: 'offer_verified_badge',
          priority: 'medium',
          title: 'Apresentar Proposta de Selo Verificado + Plano PRO',
          reason: "A empresa possui excelente reputação (#{@company.rating_avg.round(1)} ★) no portal mas ainda utiliza perfil não verificado.",
          entity_type: 'Sales::Account',
          entity_id: @account.id
        }
      end

      # Rule 4: Default follow-up
      primary_contact = @contacts.find(&:is_primary) || @contacts.first
      {
        action_type: 'schedule_followup_call',
        priority: 'normal',
        title: "Realizar ligação de acompanhamento para #{primary_contact.first_name}",
        reason: 'Manter a cadência ativa de engajamento comercial.',
        entity_type: 'Sales::Contact',
        entity_id: primary_contact.id
      }
    end
  end
end
