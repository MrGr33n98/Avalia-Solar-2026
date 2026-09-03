# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Sales::Messaging::VariableResolver do
  describe '.resolve' do
    it 'interpolates person, company, lead, and owner tags correctly' do
      person = double('Contact', first_name: 'Ana', last_name: 'Costa', email: 'ana@empresa.com.br', job_title: 'Diretora')
      company = double('Account', name: 'Energia Verde', domain: 'energiaverde.com.br')
      owner = double('User', name: 'Felipe Henrique')

      text = "Olá {{person.first_name}}, bem-vindo à {{company.name}}! Atenciosamente, {{owner.name}}."
      resolved = described_class.resolve(text, person: person, company: company, owner: owner)

      expect(resolved).to eq("Olá Ana, bem-vindo à Energia Verde! Atenciosamente, Felipe Henrique.")
    end
  end
end
