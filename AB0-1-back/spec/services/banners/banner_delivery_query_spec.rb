# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Banners::BannerDeliveryQuery do
  it 'does not deliver sponsored company banner without active subscription' do
    company = create(:company)
    banner = create(:banner, :approved, active: true, company: company, sponsored: true)

    result = described_class.call(position: banner.position).to_a

    expect(result).not_to include(banner)
  end

  it 'delivers sponsored company banner with active subscription' do
    company = create(:company)
    offer = create(:banner_offer)
    create(:banner_subscription, :active, company: company, banner_offer: offer)
    banner = create(:banner, :approved, active: true, company: company, sponsored: true)

    result = described_class.call(position: banner.position).to_a

    expect(result).to include(banner)
  end

  it 'entrega banner patrocinado com assinatura ativa de add-on' do
    company = create(:company)
    banner = create(:banner, :approved, active: true, company: company, sponsored: true)
    create(:banner_addon_subscription, banner: banner, company: company, status: 'active')

    result = described_class.call(position: banner.position).to_a

    expect(result).to include(banner)
  end

  it 'aplica frequency cap por audience_key' do
    company = create(:company)
    banner = create(:banner, :approved, active: true, company: company, sponsored: false)
    create(:banner_event, banner: banner, event_type: 'impression', tracked_at: 1.hour.ago,
           metadata_json: { 'audience_key' => 'session-1' }, valid_for_reporting: true)

    result = described_class.call(company_id: company.id, audience_key: 'session-1').to_a

    expect(result).not_to include(banner)
  end


  it 'não entrega banner de placement ainda planejado' do
    banner = create(:banner, :approved, active: true, position: 'navbar')
    allow(BannerPlacements::Catalog).to receive(:all).and_return([
      BannerPlacements::Catalog::Entry.new('navbar', ['/*'], [960, 100], 'premium', 'planned')
    ])

    expect(described_class.call(position: 'navbar')).not_to include(banner)
  end

  it 'não entrega banner expirado' do
    banner = create(:banner, :approved, active: true, end_date: 1.hour.ago)

    expect(described_class.call(position: banner.position)).not_to include(banner)
  end

  context 'categoria e duplicadas' do
    let!(:category_a) { create(:category) }
    let!(:category_b) { create(:category) }

    it 'entrega banner associado à categoria solicitada' do
      banner = create(:banner, :approved, active: true)
      banner.categories << category_a

      result = described_class.call(category_id: category_a.id, position: banner.position).to_a
      expect(result).to include(banner)
    end

    it 'entrega banner global/sem categoria associada' do
      banner = create(:banner, :approved, active: true) # Sem categorias associadas

      result = described_class.call(category_id: category_a.id, position: banner.position).to_a
      expect(result).to include(banner)
    end

    it 'não entrega banner associado a outra categoria (não global)' do
      banner = create(:banner, :approved, active: true)
      banner.categories << category_b

      result = described_class.call(category_id: category_a.id, position: banner.position).to_a
      expect(result).not_to include(banner)
    end

    it 'evita duplicação de banners com múltiplas categorias no resultado' do
      banner = create(:banner, :approved, active: true)
      banner.categories << category_a
      banner.categories << category_b

      result = described_class.call(category_id: category_a.id, position: banner.position).to_a
      # Conta quantas vezes o banner aparece no resultado
      occurrences = result.count(banner)
      expect(occurrences).to eq(1)
    end

    it 'retorna apenas banners globais para categoria inexistente' do
      banner_cat = create(:banner, :approved, active: true)
      banner_cat.categories << category_a
      banner_global = create(:banner, :approved, active: true)

      result = described_class.call(category_id: 99999, position: banner_global.position).to_a
      expect(result).to include(banner_global)
      expect(result).not_to include(banner_cat)
    end
  end

  context 'filtros de localização e ordenação' do
    it 'filtra por state e city quando especificado' do
      banner_sp = create(:banner, :approved, active: true, target_states: ['SP'], target_cities: ['São Paulo'])
      banner_rj = create(:banner, :approved, active: true, target_states: ['RJ'], target_cities: ['Rio de Janeiro'])

      result_sp = described_class.call(state: 'SP', city: 'São Paulo', position: banner_sp.position).to_a
      expect(result_sp).to include(banner_sp)
      expect(result_sp).not_to include(banner_rj)
    end

    it 'respeita prioridade, patrocinados, fair rotation e limit' do
      # Cria múltiplos banners para testar a ordenação e rotação determinística
      b1 = create(:banner, :approved, active: true, priority: 10, sponsored: true, created_at: 2.hours.ago)
      b2 = create(:banner, :approved, active: true, priority: 5, sponsored: true, created_at: 1.hour.ago)
      b3 = create(:banner, :approved, active: true, priority: 100, sponsored: false, created_at: Time.current)

      result = described_class.call(position: b1.position, limit: 2).to_a
      # Limit deve ser respeitado
      expect(result.size).to be <= 2

      # Ordenação: priority ASC, sponsored DESC, md5 ASC, created_at DESC
      # Como b2 tem priority 5 (menor que b1 e b3), ele deve vir primeiro se a prioridade for preservada
      expect(result.first).to eq(b2)
    end

    it 'não causa exceções de sintaxe SQL ou PG::InvalidColumnReference' do
      banner = create(:banner, :approved, active: true)
      category = create(:category)
      banner.categories << category

      expect {
        described_class.call(category_id: category.id, position: banner.position).to_a
      }.not_to raise_error
    end
  end
end
