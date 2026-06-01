# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Chat::Mobivolt::CompanyMatcherService, type: :service do
  let!(:category) { create(:category) }

  # Criar instalador ativo padrão
  let!(:active_installer) do
    comp = create(:company, status: 'active', segment: 'installer', state: 'SP', city: 'São Paulo')
    comp.categories << category
    comp
  end

  # Criar instalador inativo
  let!(:inactive_installer) do
    comp = create(:company, status: 'inactive', segment: 'installer', state: 'SP', city: 'São Paulo')
    comp.categories << category
    comp
  end

  # Criar distribuidor ativo (segmento diferente)
  let!(:distributor) do
    comp = create(:company, status: 'active', segment: 'distributor', state: 'SP', city: 'São Paulo')
    comp.categories << category
    comp
  end

  # Criar patrocinado
  let!(:sponsored_installer) do
    comp = create(:company, status: 'active', segment: 'installer', sponsored: true, state: 'MT', city: 'Cuiabá')
    comp.categories << category
    comp
  end

  describe '.match' do
    it 'retorna apenas empresas active e installers' do
      results = described_class.match({})
      expect(results).to include(active_installer)
      expect(results).to include(sponsored_installer)
      expect(results).not_to include(inactive_installer)
      expect(results).not_to include(distributor)
    end

    it 'filtra por cidade se fornecida' do
      results = described_class.match({ city: 'Cuiabá' })
      expect(results).to include(sponsored_installer)
      expect(results).not_to include(active_installer)
    end

    it 'prioriza empresas patrocinadas (sponsored) primeiro' do
      results = described_class.match({})
      expect(results.first).to eq(sponsored_installer) # Cuiabá sponsored
    end

    it 'limita a no máximo 5 resultados' do
      6.times do
        comp = create(:company, status: 'active', segment: 'installer', state: 'SP', city: 'São Paulo')
        comp.categories << category
      end

      results = described_class.match({ city: 'São Paulo' })
      expect(results.count).to be <= 5
    end
  end
end
