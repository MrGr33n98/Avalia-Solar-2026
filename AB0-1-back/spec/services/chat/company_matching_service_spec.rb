# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Chat::CompanyMatchingService, type: :service do
  describe '.match' do
    it 'documenta o erro conhecido da coluna inexistente public_profile na query base' do
      expect do
        described_class.match(vertical: 'solar', city: 'São Paulo', state: 'SP')
      end.to raise_error(ActiveRecord::StatementInvalid, /companies\.public_profile/)
    end
  end
end
