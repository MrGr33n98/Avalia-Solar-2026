# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Sales::Imports::HeaderMapper do
  describe '.call' do
    it 'maps Portuguese headers to canonical DTO keys' do
      headers = ['Razão Social', 'Contato', 'E-mail', 'Celular', 'UF', 'Município']
      mapping = described_class.call(headers)

      expect(mapping['Razão Social']).to eq('company_name')
      expect(mapping['Contato']).to eq('contact_name')
      expect(mapping['E-mail']).to eq('email')
      expect(mapping['Celular']).to eq('phone')
      expect(mapping['UF']).to eq('state')
      expect(mapping['Município']).to eq('city')
    end
  end
end
