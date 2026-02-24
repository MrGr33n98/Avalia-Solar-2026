require 'rails_helper'

RSpec.describe CorporateDomain::Validator do
  describe '#valid_email?' do
    it 'accepts allowed domains' do
      validator = described_class.new

      expect(validator.valid_email?('usuario@weg.net')).to be(true)
      expect(validator.valid_email?('usuario@genialinvestimentos.com.br')).to be(true)
    end

    it 'rejects domains outside the allowlist' do
      validator = described_class.new

      expect(validator.valid_email?('usuario@avaliasolar.com.br')).to be(false)
      expect(validator.valid_email?('usuario@gmail.com')).to be(false)
    end

    it 'normalizes case and @ prefix in configured values' do
      validator = described_class.new(allowed_domains: ['@WEG.NET', ' genialinvestimentos.com.br '])

      expect(validator.allowed_domains).to eq(%w[weg.net genialinvestimentos.com.br])
      expect(validator.valid_email?('User@Weg.Net')).to be(true)
    end
  end
end
