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
        page_url: 'https://www.avaliasolar.com.br/companies/test?email=felipe@example.com',
        metadata: {
          cpf: '123.456.789-00',
          device: 'iPhone 15',
          nested: {
            name: 'Felipe Henrique'
          },
          list: [[{ message: 'texto livre', category_slug: 'energia-solar' }]]
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
      expect(subject).not_to have_key('email')
      expect(subject).not_to have_key('phone')
      expect(subject).not_to have_key('ip')
    end

    it 'keeps non-PII fields intact' do
      expect(subject).not_to have_key('search_term')
      expect(subject['metadata']['device']).to eq('iPhone 15')
    end

    it 'redacts nested PII fields' do
      expect(subject['metadata']).not_to have_key('cpf')
      expect(subject['metadata']['nested']).not_to have_key('name')
      expect(subject['metadata']['list']).to eq([[{ 'category_slug' => 'energia-solar' }]])
    end

    it 'strips query strings from urls' do
      expect(subject['page_url']).to eq('https://www.avaliasolar.com.br/companies/test')
    end
  end
end
