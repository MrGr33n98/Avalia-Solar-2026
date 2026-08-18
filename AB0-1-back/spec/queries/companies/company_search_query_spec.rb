require 'rails_helper'

RSpec.describe Companies::CompanySearchQuery, type: :query do
  let!(:active_company_sp) { create(:company, name: 'Solar SP', status: :active, state: 'SP', city: 'São Paulo', rating_avg: 4.8, verified: true, whatsapp_enabled: true, financing_enabled: true, latitude: -23.5505, longitude: -46.6333) }
  let!(:active_company_rj) { create(:company, name: 'Solar RJ', status: :active, state: 'RJ', city: 'Rio de Janeiro', rating_avg: 3.5, verified: false, whatsapp_enabled: false, financing_enabled: false, latitude: -22.9068, longitude: -43.1729) }
  let!(:inactive_company) { create(:company, name: 'Solar Inativo', status: :inactive, state: 'SP', city: 'Campinas') }
  let!(:category_residencial) { create(:category, name: 'Residencial', slug: 'residencial') }
  let!(:category_industrial) { create(:category, name: 'Industrial', slug: 'industrial') }

  before do
    active_company_sp.categories << category_residencial
    active_company_rj.categories << category_industrial
  end

  describe '.call' do
    it 'retorna apenas empresas ativas por padrão' do
      result = described_class.call({})
      expect(result).to include(active_company_sp, active_company_rj)
      expect(result).not_to include(inactive_company)
    end

    it 'filtra por busca textual (q)' do
      result = described_class.call({ q: 'SP' })
      expect(result).to include(active_company_sp)
      expect(result).not_to include(active_company_rj)
    end

    it 'filtra por status específico se fornecido' do
      result = described_class.call({ status: 'inactive' })
      expect(result).to include(inactive_company)
      expect(result).not_to include(active_company_sp)
    end

    it 'filtra por destaque (featured)' do
      active_company_sp.update!(featured: true)
      result = described_class.call({ featured: 'true' })
      expect(result).to include(active_company_sp)
      expect(result).not_to include(active_company_rj)
    end

    it 'filtra por verificação (verified)' do
      result = described_class.call({ verified: 'true' })
      expect(result).to include(active_company_sp)
      expect(result).not_to include(active_company_rj)
    end

    it 'filtra por estado (state)' do
      result = described_class.call({ state: 'RJ' })
      expect(result).to include(active_company_rj)
      expect(result).not_to include(active_company_sp)
    end

    it 'filtra por cidade (city)' do
      result = described_class.call({ city: 'São Paulo' })
      expect(result).to include(active_company_sp)
      expect(result).not_to include(active_company_rj)
    end

    it 'filtra por avaliação mínima (min_rating)' do
      result = described_class.call({ min_rating: 4.0 })
      expect(result).to include(active_company_sp)
      expect(result).not_to include(active_company_rj)
    end

    it 'filtra por id de categoria (category_id)' do
      result = described_class.call({ category_id: category_residencial.id.to_s })
      expect(result).to include(active_company_sp)
      expect(result).not_to include(active_company_rj)
    end

    it 'filtra por slug de categoria (category_id)' do
      result = described_class.call({ category_id: 'industrial' })
      expect(result).to include(active_company_rj)
      expect(result).not_to include(active_company_sp)
    end

    it 'filtra por múltiplos ids de categoria (category_ids)' do
      result = described_class.call({ category_ids: [category_residencial.id, category_industrial.id].join(',') })
      expect(result).to include(active_company_sp, active_company_rj)
    end

    it 'filtra por whatsapp habilitado' do
      result = described_class.call({ whatsapp_enabled: 'true' })
      expect(result).to include(active_company_sp)
      expect(result).not_to include(active_company_rj)
    end

    it 'filtra por financiamento habilitado' do
      result = described_class.call({ financing_enabled: 'true' })
      expect(result).to include(active_company_sp)
      expect(result).not_to include(active_company_rj)
    end

    it 'filtra por raio geográfico usando lat/lng do front-end' do
      # São Paulo a São Paulo (0km)
      result = described_class.call({ lat: -23.5505, lng: -46.6333, radius_km: 50 })
      expect(result).to include(active_company_sp)
      expect(result).not_to include(active_company_rj)
    end

    it 'ignora coordenadas geográficas inválidas' do
      result = described_class.call({ lat: 91, lng: -46.6333, radius_km: 50 })

      expect(result).to include(active_company_sp, active_company_rj)
    end

    it 'ignora raio inválido sem gerar filtro geográfico' do
      result = described_class.call({ lat: -23.5505, lng: -46.6333, radius_km: 0 })

      expect(result).to include(active_company_sp, active_company_rj)
    end

    it 'ordena por distância Haversine quando coordenadas são válidas' do
      result = described_class.call(
        { lat: -23.5505, lng: -46.6333, sort: 'distance' },
        Company.where(id: [active_company_sp.id, active_company_rj.id])
      ).to_a

      expect(result.map(&:id)).to eq([active_company_sp.id, active_company_rj.id])
      expect(result.first.distance_km).to be_a(Numeric)
    end

    it 'reverte para recomendadas quando sort distance não tem geo válida' do
      result = described_class.call({ sort: 'distance', lat: 'invalid', lng: -46.6333 })

      expect(result.to_sql).to include('ORDER BY')
      expect(result).to include(active_company_sp, active_company_rj)
    end
  end
end
