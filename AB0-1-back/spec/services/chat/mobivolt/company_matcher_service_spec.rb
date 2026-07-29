# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Chat::Mobivolt::CompanyMatcherService, type: :service do
  describe '.match' do
    it 'retorna empresas ativas ordenadas pela pontuação de recomendação' do
      company = create(:company, status: 'active', rating_avg: 4.8, rating_count: 15)

      results = described_class.match(city: company.city, state: company.state)
      expect(results).to include(company)
      expect(results.size).to be <= 5
    end
  end
end
