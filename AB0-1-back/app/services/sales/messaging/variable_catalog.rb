# frozen_string_literal: true

module Sales
  module Messaging
    class VariableCatalog
      CATALOG = [
        {
          key: 'person',
          label: 'Pessoa / Contato',
          variables: [
            { token: '{{person.first_name}}', label: 'Primeiro nome', example: 'João' },
            { token: '{{person.last_name}}', label: 'Sobrenome', example: 'Silva' },
            { token: '{{person.full_name}}', label: 'Nome completo', example: 'João Silva' },
            { token: '{{person.email}}', label: 'E-mail', example: 'joao.silva@exemplo.com' },
            { token: '{{person.phone}}', label: 'Telefone', example: '(11) 99999-8888' }
          ]
        },
        {
          key: 'company',
          label: 'Empresa / Conta',
          variables: [
            { token: '{{company.name}}', label: 'Nome da Empresa', example: 'Solar Tech LTDA' },
            { token: '{{company.website}}', label: 'Website', example: 'https://solartech.com.br' },
            { token: '{{company.city}}', label: 'Cidade', example: 'São Paulo' },
            { token: '{{company.state}}', label: 'Estado', example: 'SP' }
          ]
        },
        {
          key: 'opportunity',
          label: 'Oportunidade / Proposta',
          variables: [
            { token: '{{opportunity.title}}', label: 'Título da Oportunidade', example: 'Projeto Residencial 10kW' },
            { token: '{{opportunity.value}}', label: 'Valor estimado', example: 'R$ 35.000,00' },
            { token: '{{opportunity.stage}}', label: 'Estágio do Funil', example: 'Proposta Enviada' }
          ]
        },
        {
          key: 'owner',
          label: 'Consultor / Remetente',
          variables: [
            { token: '{{owner.first_name}}', label: 'Primeiro nome do consultor', example: 'Carlos' },
            { token: '{{owner.full_name}}', label: 'Nome completo do consultor', example: 'Carlos Oliveira' },
            { token: '{{owner.email}}', label: 'E-mail do consultor', example: 'carlos@avaliasolar.com.br' },
            { token: '{{owner.phone}}', label: 'Telefone do consultor', example: '(11) 98888-7777' }
          ]
        }
      ].freeze

      def self.all_groups
        CATALOG
      end
    end
  end
end
