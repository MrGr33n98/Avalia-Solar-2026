# frozen_string_literal: true

require 'rails_helper'
require 'sidekiq/testing'

Sidekiq::Testing.fake!

RSpec.describe 'GraphQL Sprint C — Financing Simulation', type: :request do
  let!(:category) do
    Category.create!(
      name: 'Instalação Solar',
      seo_url: 'instalacao-solar',
      description: 'Categoria de instalação solar',
      status: 'active'
    )
  end

  let!(:company_1) do
    comp = Company.new(
      name: 'Solar Tech A',
      description: 'Empresa A',
      email: 'contato@tech-a.com',
      phone: '(11) 99999-0001',
      city: 'São Paulo',
      state: 'SP',
      status: 'active',
      active_admin: true
    )
    comp.categories << category
    comp.save!
    comp
  end

  let!(:company_2) do
    comp = Company.new(
      name: 'Solar Tech B',
      description: 'Empresa B',
      email: 'contato@tech-b.com',
      phone: '(11) 99999-0002',
      city: 'Florianópolis',
      state: 'SC',
      status: 'active',
      active_admin: true
    )
    comp.categories << category
    comp.save!
    comp
  end

  let!(:financing_option_1) do
    FinancingOption.create!(
      company: company_1,
      institution_name: 'Banco BV',
      credit_line: 'Solar BV',
      target_audience: 'PF',
      max_term_months: 60,
      grace_period_months: 3,
      interest_rate_percent: 1.5,
      interest_rate_details: 'Taxa pré-fixada',
      active: true
    )
  end

  let!(:financing_option_2) do
    FinancingOption.create!(
      company: company_2,
      institution_name: 'Santander',
      credit_line: 'Solar Santander',
      target_audience: 'PJ',
      max_term_months: 48,
      grace_period_months: 2,
      interest_rate_percent: 1.8,
      interest_rate_details: 'Taxa para empresas',
      active: true
    )
  end

  let!(:inactive_financing_option) do
    FinancingOption.create!(
      company: company_1,
      institution_name: 'Banco BV Inativo',
      credit_line: 'Solar BV Desativado',
      target_audience: 'PF',
      max_term_months: 60,
      grace_period_months: 3,
      interest_rate_percent: 1.2,
      interest_rate_details: 'Inativo',
      active: false
    )
  end

  describe 'Query compareFinancingOptions' do
    let(:query) do
      <<-GRAPHQL
        query GetFinancingComparison(
          $amount: Float!,
          $installments: Int!,
          $state: String,
          $city: String,
          $companyIds: [ID!],
          $audience: String
        ) {
          compareFinancingOptions(
            amount: $amount,
            installments: $installments,
            state: $state,
            city: $city,
            companyIds: $companyIds,
            audience: $audience
          ) {
            id
            institutionName
            creditLine
            targetAudience
            maxTermMonths
            gracePeriodMonths
            interestRatePercent
            interestRateDetails
            active
            monthlyPayment
            totalCost
            cetAnnualPercent
            company {
              id
              name
            }
          }
        }
      GRAPHQL
    end

    it 'calcula simulações para todas as opções de financiamento ativas' do
      post '/graphql', params: {
        query: query,
        variables: { amount: 10000.0, installments: 12 }
      }, as: :json
      expect(response).to have_http_status(:success)
      json = JSON.parse(response.body)
      options = json.dig('data', 'compareFinancingOptions')

      # Deve retornar apenas as duas opções ativas
      expect(options.size).to eq(2)
      
      # Verifica se os cálculos e ordenação estão corretos (1.5% antes de 1.8%)
      expect(options[0]['institutionName']).to eq('Banco BV')
      expect(options[0]['monthlyPayment']).to be_present
      expect(options[0]['totalCost']).to be_present
      expect(options[0]['cetAnnualPercent']).to be_present
      expect(options[0]['company']['name']).to eq(company_1.name)

      expect(options[1]['institutionName']).to eq('Santander')
      expect(options[1]['company']['name']).to eq(company_2.name)
    end

    it 'permite filtrar por público-alvo (audience)' do
      post '/graphql', params: {
        query: query,
        variables: { amount: 10000.0, installments: 12, audience: 'pf' }
      }, as: :json
      json = JSON.parse(response.body)
      options = json.dig('data', 'compareFinancingOptions')

      expect(options.size).to eq(1)
      expect(options[0]['institutionName']).to eq('Banco BV')
    end

    it 'permite filtrar por ids específicos de empresas' do
      post '/graphql', params: {
        query: query,
        variables: { amount: 10000.0, installments: 12, companyIds: [company_2.id.to_s] }
      }, as: :json
      json = JSON.parse(response.body)
      options = json.dig('data', 'compareFinancingOptions')

      expect(options.size).to eq(1)
      expect(options[0]['institutionName']).to eq('Santander')
    end

    it 'permite filtrar por localização da empresa (state e city)' do
      post '/graphql', params: {
        query: query,
        variables: { amount: 10000.0, installments: 12, state: 'SC', city: 'Florianópolis' }
      }, as: :json
      json = JSON.parse(response.body)
      options = json.dig('data', 'compareFinancingOptions')

      expect(options.size).to eq(1)
      expect(options[0]['institutionName']).to eq('Santander')
    end
  end
end
