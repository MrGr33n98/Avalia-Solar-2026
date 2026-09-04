# frozen_string_literal: true

require 'csv'

module Sales
  class AccountExportService
    attr_reader :relation, :params

    def initialize(relation, params = {})
      @relation = relation
      @params = params
    end

    def self.call(relation, params = {})
      new(relation, params).call
    end

    def call
      accounts_query = ::Sales::AccountsQuery.call(relation, params)
      accounts = if params[:selected_ids].present?
                   ids = Array(params[:selected_ids]).map(&:to_i)
                   relation.where(id: ids).includes(:company, :owner, :contacts, :tags)
                 else
                   accounts_query.includes(:company, :owner, :contacts, :tags)
                 end

      generate_csv(accounts)
    end

    private

    def generate_csv(accounts)
      CSV.generate(headers: true, col_sep: ',') do |csv|
        csv << [
          'ID',
          'Nome da Empresa',
          'Domínio',
          'Tipo de Empresa',
          'Status',
          'Proprietário',
          'Contato Principal',
          'E-mail Contato',
          'Telefone',
          'Cidade',
          'Estado',
          'Criado em'
        ]

        accounts.find_each(batch_size: 500) do |account|
          contacts = account.contacts.to_a
          primary = contacts.find(&:is_primary?) || contacts.first
          primary_name = primary ? "#{primary.first_name} #{primary.last_name}".strip : ''

          csv << [
            account.id,
            account.name,
            account.domain,
            account.segment || account.company_size || 'Standard Account',
            account.status,
            account.owner&.name,
            primary_name,
            primary&.email || account.email,
            account.phone,
            account.city,
            account.state,
            account.created_at&.iso8601
          ]
        end
      end
    end
  end
end
