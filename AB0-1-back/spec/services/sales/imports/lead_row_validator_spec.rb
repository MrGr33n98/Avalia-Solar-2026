# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Sales::Imports::LeadRowValidator do
  let(:company) { Company.create!(name: 'Empresa Teste', domain: 'teste.com') }
  let(:user) { User.create!(email: "user_#{SecureRandom.hex(4)}@test.com", password: 'Password123!', name: 'Felipe', company: company) }
  let!(:pipeline) { Sales::Pipeline.create!(name: 'Avalia Solar B2B Sales', key: "b2b_#{SecureRandom.hex(4)}", active: true) }
  let!(:stage_prospect) { pipeline.stages.create!(name: 'Prospect', key: 'prospect', position: 0) }
  let!(:stage_qualified) { pipeline.stages.create!(name: 'Qualified', key: 'qualified', position: 1) }

  describe '.call' do
    it 'validates row with valid email, company and stage without querying undefined sales_pipelines.company_id' do
      dto = Struct.new(
        :company_name, :contact_name, :email, :phone, :whatsapp, :website,
        :owner_identifier, :stage_identifier,
        keyword_init: true
      ).new(
        company_name: 'Solar Tech Cuiabá',
        contact_name: 'João Silva',
        email: 'joao@solartech.com',
        phone: '65999887766',
        whatsapp: nil,
        website: nil,
        owner_identifier: user.name,
        stage_identifier: 'Prospect'
      )

      result = described_class.call(dto, company: company)

      expect(result[:valid]).to be true
      expect(result[:errors]).to be_empty
      expect(result[:warnings]).to be_empty
    end

    it 'resolves stage with Portuguese synonym without undefined column error' do
      dto = Struct.new(
        :company_name, :contact_name, :email, :phone, :whatsapp, :website,
        :owner_identifier, :stage_identifier,
        keyword_init: true
      ).new(
        company_name: 'AgroEnergia Rondonópolis',
        contact_name: 'Maria Souza',
        email: 'maria@agroenergia.com',
        phone: '66998765432',
        whatsapp: nil,
        website: nil,
        owner_identifier: nil,
        stage_identifier: 'Qualificado'
      )

      result = described_class.call(dto, company: company)

      expect(result[:valid]).to be true
      expect(result[:errors]).to be_empty
      expect(result[:warnings]).to be_empty
    end

    it 'adds warning if stage is not found instead of raising exception' do
      dto = Struct.new(
        :company_name, :contact_name, :email, :phone, :whatsapp, :website,
        :owner_identifier, :stage_identifier,
        keyword_init: true
      ).new(
        company_name: 'Solar Inexistente',
        contact_name: 'Carlos',
        email: 'carlos@teste.com',
        phone: '65999990000',
        whatsapp: nil,
        website: nil,
        owner_identifier: nil,
        stage_identifier: 'EstagioInexistenteXYZ'
      )

      result = described_class.call(dto, company: company)

      expect(result[:valid]).to be true
      expect(result[:errors]).to be_empty
      expect(result[:warnings]).to include("Estágio 'EstagioInexistenteXYZ' não foi encontrado na organização")
    end
  end
end
