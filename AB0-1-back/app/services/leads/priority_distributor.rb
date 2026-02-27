module Leads
  class PriorityDistributor
    def self.call(lead)
      new(lead).distribute
    end

    def initialize(lead)
      @lead = lead
    end

    def distribute
      # Se o lead já escolheu uma empresa específica, não distribuímos para outras
      return [@lead.company] if @lead.company_id.present?

      # Encontrar as empresas medalhistas (Top 3) da cidade/estado do lead
      # que possuem o recurso de orçamentos ativo (active_admin: true)
      target_companies = Company.active
                                .where(city: @lead.city, state: @lead.state)
                                .where(active_admin: true)
                                .ordered_by_priority
                                .limit(3)

      # Se não houver empresas na cidade, tenta no estado
      if target_companies.empty?
        target_companies = Company.active
                                  .where(state: @lead.state)
                                  .where(active_admin: true)
                                  .ordered_by_priority
                                  .limit(3)
      end

      # Registrar a distribuição para auditoria e controle
      target_companies.each do |company|
        LeadDistribution.find_or_create_by!(lead: @lead, company: company) do |ld|
          ld.status = 'queued'
          ld.assigned_at = Time.current
        end
      end

      target_companies
    end
  end
end
