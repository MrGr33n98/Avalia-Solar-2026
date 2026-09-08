# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Sales::Imports::LeadRowNormalizer do
  describe '.call' do
    it 'normalizes email to lowercase and phone to E.164' do
      row = { 'Empresa' => ' Solar MT ', 'Email' => ' JOAO@SOLAR.COM ', 'Fone' => '(65) 99999-8888', 'UF' => 'mato grosso' }
      mapping = { 'Empresa' => 'company_name', 'Email' => 'email', 'Fone' => 'phone', 'UF' => 'state' }

      dto = described_class.call(row, mapping)

      expect(dto.company_name).to eq('Solar MT')
      expect(dto.email).to eq('joao@solar.com')
      expect(dto.phone).to eq('+5565999998888')
      expect(dto.state).to eq('MT')
    end
  end
end
