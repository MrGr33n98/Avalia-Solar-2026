require 'rails_helper'

RSpec.describe Company, type: :model do
  let(:category) { Category.create!(name: 'Solar', description: 'Categoria de energia solar') }

  describe 'validações' do
    it 'exige whatsapp_url quando whatsapp_enabled' do
      company = build(:company, whatsapp_enabled: true, whatsapp_url: nil)

      expect(company).not_to be_valid
      expect(company.errors[:whatsapp_url]).to be_present
    end

    it 'não permite status active sem requisitos' do
      company = build(:company, status: 'active', email: nil, state: nil, city: nil)

      expect(company).not_to be_valid
      expect(company.errors[:status]).to be_present
    end

    it 'valida estado inválido' do
      company = build(:company, state: 'ZZ', city: 'Cidade Inexistente')

      expect(company).not_to be_valid
      expect(company.errors[:state]).to be_present
    end

    it 'valida cidade fora do estado' do
      company = build(:company, state: 'SP', city: 'Cidade Inexistente')

      expect(company).not_to be_valid
      expect(company.errors[:city]).to be_present
    end

    it 'valida faixa de ticket' do
      company = build(:company, minimum_ticket: 200, maximum_ticket: 100)

      expect(company).not_to be_valid
      expect(company.errors[:minimum_ticket]).to be_present
    end
  end

  describe '#ready_for_activation?' do
    it 'retorna true com requisitos completos' do
      company = build(
        :company,
        status: 'active',
        name: 'Empresa Solar',
        description: 'Descricao da empresa',
        email: 'contato@empresa.com',
        state: 'SP',
        city: 'São Paulo',
        phone: '11999999999'
      )
      company.categories << category

      expect(company.ready_for_activation?).to be(true)
      expect(company).to be_valid
    end
  end
end
