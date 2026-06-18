# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Search::CompanySearchService, type: :service do
  describe '#call' do
    let(:query) { 'EmpresaInexistenteQueNaoDeveRetornarNada123' }

    before do
      # Forca a busca a cair para o fallback de PostgreSQL
      allow_any_instance_of(Search::CompanySearchService).to receive(:search_enabled?).and_return(false)
    end

    context 'quando a busca retorna zero resultados' do
      it 'cria um registro em SearchZeroResult com os parametros de busca' do
        expect {
          Search::CompanySearchService.new(q: query, state: 'SP', city: 'Sao Paulo').call
        }.to change(SearchZeroResult, :count).by(1)

        zero_result = SearchZeroResult.last
        expect(zero_result.query).to eq(query)
        expect(zero_result.state).to eq('SP')
        expect(zero_result.city).to eq('Sao Paulo')
        expect(zero_result.search_type).to eq('postgresql')
      end

      it 'dispara um evento de tracking para o PostHog' do
        expect(Analytics::PostHogService).to receive(:capture).with(
          'search_zero_results',
          hash_including(query: query, state: 'SP', city: 'Sao Paulo', search_type: 'postgresql'),
          distinct_id: 'anonymous_search'
        )

        Search::CompanySearchService.new(q: query, state: 'SP', city: 'Sao Paulo').call
      end
    end

    context 'quando a busca retorna resultados' do
      let!(:category) { Category.create!(name: 'Instaladores', seo_url: 'instaladores', status: 'active', description: 'Descrição da categoria') }
      let!(:company) do
        Company.create!(
          name: 'Solar Tech BR',
          slug: 'solar-tech-br',
          description: 'Descricao da empresa',
          email: 'contato@solartech.com.br',
          state: 'SP',
          city: 'São Paulo',
          phone: '11999999999',
          categories: [category],
          status: 'active'
        )
      end

      it 'nao cria registro em SearchZeroResult se encontrar correspondencias' do
        expect {
          Search::CompanySearchService.new(q: 'Solar Tech BR').call
        }.to_not change(SearchZeroResult, :count)
      end

      it 'interpreta uma cidade sem acento no q como filtro de localizacao' do
        result = Search::CompanySearchService.new(q: 'sao paulo').call

        expect(result[:nodes]).to include(company)
        expect(result[:nodes].map(&:city)).to all(eq('São Paulo'))
      end

      it 'busca empresas pelo nome da categoria' do
        result = Search::CompanySearchService.new(q: 'instaladores').call

        expect(result[:nodes]).to include(company)
      end
    end
  end
end
