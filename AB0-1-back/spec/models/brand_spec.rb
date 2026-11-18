# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Brand, type: :model do
  describe 'validations' do
    subject { build(:brand) }

    it { is_expected.to validate_presence_of(:name) }
    it { is_expected.to validate_uniqueness_of(:slug).case_insensitive }

    it 'valida presença de slug quando nome não permite geração automática' do
      brand = build(:brand, name: nil, slug: nil)
      expect(brand).not_to be_valid
      expect(brand.errors[:slug]).to be_present
    end

    it 'permite status válidos' do
      Brand::STATUSES.each do |valid_status|
        expect(build(:brand, status: valid_status)).to be_valid
      end
    end

    it 'rejeita status inválido' do
      expect(build(:brand, status: 'invalid_status')).not_to be_valid
    end

    it 'rejeita aliases que não sejam array' do
      brand = build(:brand, aliases: 'not_an_array')
      expect(brand).not_to be_valid
      expect(brand.errors[:aliases]).to include('deve ser uma lista de nomes alternativos')
    end

    it 'gera slug automaticamente a partir do nome se estiver em branco' do
      brand = create(:brand, name: 'Fronius Solar Brasil', slug: nil)
      expect(brand.slug).to eq('fronius-solar-brasil')
    end

    it 'normaliza o slug para minúsculas' do
      brand = create(:brand, name: 'Solis Inverters', slug: 'SOLIS-INVERTERS')
      expect(brand.slug).to eq('solis-inverters')
    end
  end

  describe 'logo validation' do
    it 'aceita logo PNG válido até 2MB' do
      brand = build(:brand, :with_logo)
      expect(brand).to be_valid
      expect(brand.logo).to be_attached
    end

    it 'rejeita tipos de arquivo inseguros como SVG para proteção contra XSS' do
      brand = build(:brand)
      brand.logo.attach(
        io: StringIO.new('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>'),
        filename: 'malicious.svg',
        content_type: 'image/svg+xml'
      )
      expect(brand).not_to be_valid
      expect(brand.errors[:logo]).to include('deve ser PNG, JPG ou WEBP')
    end

    it 'rejeita logo acima do limite de 2MB' do
      brand = build(:brand)
      oversized_data = '0' * (2.megabytes + 10)
      brand.logo.attach(
        io: StringIO.new(oversized_data),
        filename: 'heavy_logo.png',
        content_type: 'image/png'
      )
      expect(brand).not_to be_valid
      expect(brand.errors[:logo]).to include('tamanho máximo é 2MB')
    end
  end

  describe '#initials' do
    it 'gera monograma de 2 letras para nomes compostos' do
      expect(build(:brand, name: 'WEG Solar').initials).to eq('WS')
      expect(build(:brand, name: 'Canadian Solar').initials).to eq('CS')
    end

    it 'gera monograma com as duas primeiras letras para palavra única' do
      expect(build(:brand, name: 'Fronius').initials).to eq('FR')
      expect(build(:brand, name: 'Growatt').initials).to eq('GR')
    end

    it 'lida com siglas curtas' do
      expect(build(:brand, name: 'BYD').initials).to eq('BY')
    end

    it 'fornece fallback quando o nome é vazio' do
      expect(build(:brand, name: '').initials).to eq('SO')
    end
  end

  describe '#as_catalog_json' do
    let(:brand) { create(:brand, name: 'Deye Inverters', slug: 'deye-inverters') }

    it 'retorna estrutura compatível com API_CONTRACTS.md' do
      json = brand.as_catalog_json
      expect(json).to include(
        id: brand.id,
        name: 'Deye Inverters',
        slug: 'deye-inverters',
        logo_url: nil,
        logo_alt: 'Deye Inverters',
        initials: 'DI',
        status: 'active'
      )
    end
  end

  describe '.find_by_value' do
    let!(:brand) { create(:brand, name: 'Sungrow', slug: 'sungrow') }

    it 'localiza por ID numérico' do
      expect(described_class.find_by_value(brand.id)).to eq(brand)
    end

    it 'localiza por slug textual' do
      expect(described_class.find_by_value('sungrow')).to eq(brand)
    end

    it 'retorna nil para valor em branco' do
      expect(described_class.find_by_value('')).to be_nil
    end
  end

  describe 'scopes' do
    let!(:active_brand) do
      create(:brand, name: 'Solis Inverters', slug: 'solis-inverters', aliases: ['Ginlong', 'Solis'], status: 'active')
    end
    let!(:disabled_brand) do
      create(:brand, name: 'Marca Legada Desativada', slug: 'marca-desativada', status: 'disabled')
    end

    describe '.active' do
      it 'filtra somente fabricantes com status active' do
        expect(described_class.active).to include(active_brand)
        expect(described_class.active).not_to include(disabled_brand)
      end
    end

    describe '.search_by_query' do
      it 'encontra por correspondência no nome' do
        results = described_class.search_by_query('solis')
        expect(results).to include(active_brand)
      end

      it 'encontra por correspondência dentro do array de aliases' do
        results = described_class.search_by_query('ginlong')
        expect(results).to include(active_brand)
      end

      it 'retorna escopo completo quando a busca for vazia' do
        expect(described_class.search_by_query('')).to include(active_brand, disabled_brand)
      end
    end
  end
end
