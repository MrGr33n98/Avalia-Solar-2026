require 'rails_helper'

RSpec.describe Company, type: :model do
  let(:category) { Category.create!(name: 'Solar', description: 'Categoria de energia solar') }

  describe 'validacoes' do
    it 'permite empresa sem CNPJ' do
      company = build(:company, cnpj: nil, status: 'pending')

      expect(company).to be_valid
    end

    it 'valida formato de CNPJ quando informado' do
      company = build(:company, cnpj: 'cnpj-invalido')

      expect(company).not_to be_valid
      expect(company.errors[:cnpj]).to be_present
    end

    it 'impede CNPJ duplicado antes de persistir' do
      create(:company, cnpj: '11222333000181')
      duplicate = build(:company, cnpj: '11.222.333/0001-81')

      expect(duplicate).not_to be_valid
      expect(duplicate.errors[:cnpj]).to include('já está cadastrado')
    end

    it 'exige whatsapp_url quando whatsapp_enabled' do
      company = build(:company, whatsapp_enabled: true, whatsapp_url: nil)

      expect(company).not_to be_valid
      expect(company.errors[:whatsapp_url]).to be_present
    end

    it 'nao permite status active sem requisitos' do
      company = build(:company, status: 'active', email: nil, state: nil, city: nil)

      expect(company).not_to be_valid
      expect(company.errors[:email]).to be_present
    end

    it 'valida estado invalido' do
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

    context 'corporate email validation' do
      it 'allows public email when status is pending' do
        company = build(:company, status: 'pending', email_public: 'test@gmail.com')
        expect(company.valid?).to be true
      end

      it 'allows email with different domain when status is active' do
        company = build(
          :company,
          status: 'active',
          website: 'https://corporativo.com',
          email: 'test@gmail.com'
        )
        company.valid?
        expect(company.errors[:email]).to be_empty
      end

      it 'allows email matching website domain when status is active' do
        company = build(
          :company,
          status: 'active',
          website: 'https://corporativo.com',
          email: 'test@corporativo.com'
        )
        company.valid?
        expect(company.errors[:email]).to be_empty
      end
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
