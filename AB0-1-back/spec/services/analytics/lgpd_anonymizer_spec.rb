require 'rails_helper'

RSpec.describe Analytics::LgpdAnonymizer do
  describe '#anonymize' do
    let(:payload) do
      {
        user_id: 123,
        email: 'felipe@avaliasolar.com',
        phone: '+5511999999999',
        ip: '192.168.1.1',
        search_term: 'integradores são paulo',
        metadata: {
          cpf: '123.456.789-00',
          device: 'iPhone 15',
          nested: {
            name: 'Felipe Henrique'
          }
        }
      }
    end

    subject { described_class.new(payload).anonymize }

    it 'hashes user_id with salt' do
      expect(subject['user_id']).not_to eq(123)
      expect(subject['user_id']).to be_a(String)
      expect(subject['user_id'].length).to eq(64) # SHA256 length
    end

    it 'redacts top level PII fields' do
      expect(subject['email']).to eq('[REDACTED]')
      expect(subject['phone']).to eq('[REDACTED]')
      expect(subject['ip']).to eq('[REDACTED]')
    end

    it 'keeps non-PII fields intact' do
      expect(subject['search_term']).to eq('integradores são paulo')
      expect(subject['metadata']['device']).to eq('iPhone 15')
    end

    it 'redacts nested PII fields' do
      expect(subject['metadata']['cpf']).to eq('[REDACTED]')
      expect(subject['metadata']['nested']['name']).to eq('[REDACTED]')
    end
  end
end
