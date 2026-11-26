# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Storefront::PublicProfileService do
  let(:company) do
    instance_double(
      'Company',
      id: 42,
      name: 'WEG Solar Brasil',
      slug: 'weg-solar',
      status: 'active',
      verified?: true,
      logo_url: 'https://cdn.avaliasolar.com.br/logos/weg.png',
      city: 'Jaraguá do Sul',
      state: 'SC',
      average_rating: 4.9,
      reviews_count: 120,
      description: 'Líder nacional em inversores e soluções solares completas.'
    )
  end

  before do
    allow(company).to receive(:products).and_return([])
  end

  describe '.call' do
    context 'quando a empresa existe e está ativa' do
      before do
        allow(Company).to receive(:find_by).with(slug: 'weg-solar', status: 'active').and_return(company)
      end

      it 'retorna o envelope v1 com os dados da empresa e configurações de vitrine' do
        result = described_class.call(slug: 'weg-solar')

        expect(result[:schema_version]).to eq('v1')
        expect(result[:source_type]).to eq('avalia_solar_verified_storefront')

        data = result[:data]
        expect(data[:company][:id]).to eq(42)
        expect(data[:company][:name]).to eq('WEG Solar Brasil')
        expect(data[:company][:slug]).to eq('weg-solar')
        expect(data[:company][:headquarters]).to eq({ city: 'Jaraguá do Sul', state: 'SC' })
        expect(data[:company][:rating]).to eq(4.9)
        expect(data[:company][:review_count]).to eq(120)

        settings = data[:settings]
        expect(settings[:cta_label]).to eq('Solicitar Orçamento')
        expect(settings[:show_calculator]).to be true
        expect(settings[:direct_quote_enabled]).to be true
      end
    end

    context 'quando o slug não existe ou a empresa está inativa' do
      before do
        allow(Company).to receive(:find_by).with(slug: 'empresa-inexistente', status: 'active').and_return(nil)
      end

      it 'levanta Storefront::PublicProfileService::NotFoundError' do
        expect do
          described_class.call(slug: 'empresa-inexistente')
        end.to raise_error(Storefront::PublicProfileService::NotFoundError, /não encontrada ou inativa/)
      end
    end
  end
end

