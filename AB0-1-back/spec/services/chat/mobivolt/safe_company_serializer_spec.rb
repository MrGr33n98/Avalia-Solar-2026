# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Chat::Mobivolt::SafeCompanySerializer, type: :service do
  let(:company) do
    build(:company,
      name: 'Instalador Premium',
      cnpj: '12.345.678/0001-90',
      api_key: 'confidencial_api_key_123',
      email: 'interno@empresa.com.br',
      email_public: 'contato@empresa.com.br',
      city: 'São Paulo',
      state: 'SP',
      sponsored: true,
      verified: true,
      rating_avg: 4.8,
      rating_count: 10,
      slug: 'instalador-premium',
      services_offered: ['Instalação', 'Projeto'],
      niche_tags: ['Baterias e Off-Grid']
    )
  end

  describe '.serialize' do
    subject(:serialized) { described_class.serialize(company) }

    it 'inclui campos públicos e estruturados permitidos' do
      expect(serialized).to include(id: company.id)
      expect(serialized[:nome]).to eq('Instalador Premium')
      expect(serialized[:cidade]).to eq('São Paulo')
      expect(serialized[:estado]).to eq('SP')
      expect(serialized[:nota_media]).to eq(4.8)
      expect(serialized[:total_avaliacoes]).to eq(10)
      expect(serialized[:link_perfil]).to eq('https://www.avaliasolar.com.br/companies/instalador-premium')
      expect(serialized[:patrocinada]).to be true
      expect(serialized[:verificada]).to be true
      expect(serialized[:servicos]).to eq(['Instalação', 'Projeto'])
      expect(serialized[:nichos]).to eq(['Baterias e Off-Grid'])
    end

    it 'retorna false ou nil adequadamente para flags booleanas' do
      # Teste com valores explicitamente falsos
      false_company = build(:company,
        sponsored: false,
        verified: false,
        financing_enabled: false,
        post_sales_support: false
      )
      false_serialized = described_class.serialize(false_company)
      expect(false_serialized[:patrocinada]).to be(false)
      expect(false_serialized[:verificada]).to be(false)
      expect(false_serialized[:has_financing]).to be(false)
      expect(false_serialized[:post_sales_support]).to be(false)

      # Teste com valores nil
      nil_company = build(:company,
        sponsored: nil,
        verified: nil,
        financing_enabled: nil,
        post_sales_support: nil
      )
      nil_serialized = described_class.serialize(nil_company)
      expect(nil_serialized[:patrocinada]).to be(false)
      expect(nil_serialized[:verificada]).to be(false)
      expect(nil_serialized[:has_financing]).to be(false)
      expect(nil_serialized[:post_sales_support]).to be(false)
    end

    it 'não inclui chaves ou campos privados sensíveis de LGPD/Negócio' do
      expect(serialized.keys).not_to include(:cnpj)
      expect(serialized.keys).not_to include(:api_key)
      expect(serialized.keys).not_to include(:email)
      expect(serialized.values).not_to include('confidencial_api_key_123')
      expect(serialized.values).not_to include('12.345.678/0001-90')
      expect(serialized.values).not_to include('interno@empresa.com.br')
    end
  end
end
