# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Territory do
  describe 'creation and hierarchy' do
    it 'creates a country territory' do
      br = described_class.country
      expect(br.canonical_id).to eq('BR')
      expect(br.level).to eq(:country)
      expect(br.country?).to be true
      expect(br.state?).to be false
      expect(br.municipality?).to be false
    end

    it 'creates a state territory' do
      sc = described_class.state('SC')
      expect(sc.canonical_id).to eq('BR-SC')
      expect(sc.level).to eq(:state)
      expect(sc.name).to eq('Santa Catarina')
      expect(sc.parent_id).to eq('BR')
      expect(sc.state_code).to eq('SC')
      expect(sc.state?).to be true
    end

    it 'creates a municipality territory with IBGE and TOM codes' do
      floripa = described_class.municipality(
        'Florianópolis',
        uf: 'SC',
        ibge_code: '4205407',
        tom_code: '8105',
        aliases: ['Floripa']
      )

      expect(floripa.canonical_id).to eq('BR-SC-florianopolis')
      expect(floripa.level).to eq(:municipality)
      expect(floripa.slug).to eq('florianopolis')
      expect(floripa.parent_id).to eq('BR-SC')
      expect(floripa.ibge_code).to eq('4205407')
      expect(floripa.tom_code).to eq('8105')
      expect(floripa.matches_slug?('florianopolis')).to be true
      expect(floripa.matches_slug?('floripa')).to be true
    end

    it 'distinguishes homonym municipalities in different states' do
      bom_jesus_sc = described_class.municipality('Bom Jesus', uf: 'SC', ibge_code: '4202578')
      bom_jesus_rs = described_class.municipality('Bom Jesus', uf: 'RS', ibge_code: '4302308')

      expect(bom_jesus_sc.canonical_id).to eq('BR-SC-bom-jesus')
      expect(bom_jesus_rs.canonical_id).to eq('BR-RS-bom-jesus')
      expect(bom_jesus_sc.canonical_id).not_to eq(bom_jesus_rs.canonical_id)
      expect(bom_jesus_sc.ibge_code).not_to eq(bom_jesus_rs.ibge_code)
    end
  end

  describe '.resolve' do
    it 'resolves country by canonical ID or keyword' do
      expect(described_class.resolve('BR').canonical_id).to eq('BR')
      expect(described_class.resolve('brasil').canonical_id).to eq('BR')
    end

    it 'resolves state by UF or canonical ID' do
      expect(described_class.resolve('SC').canonical_id).to eq('BR-SC')
      expect(described_class.resolve('BR-SP').canonical_id).to eq('BR-SP')
    end

    it 'resolves municipality by canonical ID or city name with UF hint' do
      expect(described_class.resolve('BR-SC-florianopolis').canonical_id).to eq('BR-SC-florianopolis')
      expect(described_class.resolve('Florianópolis', uf: 'SC').canonical_id).to eq('BR-SC-florianopolis')
    end
  end
end
