module Sales
  class DataQualityCalculator
    FIELDS = [
      { key: :name, label: 'Nome da Empresa', weight: 15 },
      { key: :domain, label: 'Domínio / Website', weight: 10 },
      { key: :phone, label: 'Telefone Comercial', weight: 15 },
      { key: :email, label: 'E-mail Comercial', weight: 15 },
      { key: :city, label: 'Cidade', weight: 10 },
      { key: :state, label: 'Estado (UF)', weight: 10 },
      { key: :segment, label: 'Segmento de Atuação', weight: 10 },
      { key: :company_id, label: 'Vínculo com Marketplace', weight: 5 },
      { key: :has_contacts, label: 'Ao menos 1 Contato', weight: 10 }
    ].freeze

    def self.calculate(account)
      new(account).calculate
    end

    def initialize(account)
      @account = account
    end

    def calculate
      score = 0
      missing = []

      FIELDS.each do |field|
        present = case field[:key]
                  when :has_contacts
                    @account.contacts.exists?
                  else
                    @account.send(field[:key]).present?
                  end

        if present
          score += field[:weight]
        else
          missing << field[:label]
        end
      end

      { score: score, missing_fields: missing }
    end
  end
end
