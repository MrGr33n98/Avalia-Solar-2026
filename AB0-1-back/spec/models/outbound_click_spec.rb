# frozen_string_literal: true

require 'rails_helper'

RSpec.describe OutboundClick, type: :model do
  describe 'associations' do
    it 'belongs to company' do
      association = described_class.reflect_on_association(:company)
      expect(association&.macro).to eq(:belongs_to)
    end

    it 'belongs to anonymous_session optionally' do
      association = described_class.reflect_on_association(:anonymous_session)
      expect(association&.macro).to eq(:belongs_to)
      expect(association&.options[:optional]).to be(true)
    end
  end

  describe 'validations' do
    let!(:company) { create(:company) }
    let(:base_attributes) do
      {
        company_id: company.id,
        source_context: 'profile',
        destination_type: 'website',
        target_url: 'https://exemplo-solar.com.br',
        click_token_signature: 'a' * 64,
        clicked_at: Time.current
      }
    end

    it 'é válido com atributos mínimos obrigatórios' do
      click = described_class.new(base_attributes)
      expect(click).to be_valid
    end

    it 'exige company_id' do
      click = described_class.new(base_attributes.merge(company_id: nil))
      expect(click).not_to be_valid
      expect(click.errors[:company_id]).to be_present
    end

    it 'valida source_context na lista branca' do
      click = described_class.new(base_attributes.merge(source_context: 'origem_invalida_hacker'))
      expect(click).not_to be_valid
      expect(click.errors[:source_context]).to be_present

      OutboundClick::ALLOWED_SOURCES.each do |src|
        valid_click = described_class.new(base_attributes.merge(source_context: src))
        expect(valid_click).to be_valid
      end
    end

    it 'valida destination_type na lista branca' do
      click = described_class.new(base_attributes.merge(destination_type: 'destino_malicioso'))
      expect(click).not_to be_valid
      expect(click.errors[:destination_type]).to be_present

      OutboundClick::ALLOWED_DESTINATION_TYPES.each do |dest|
        valid_click = described_class.new(base_attributes.merge(destination_type: dest))
        expect(valid_click).to be_valid
      end
    end

    it 'exige target_url' do
      click = described_class.new(base_attributes.merge(target_url: nil))
      expect(click).not_to be_valid
      expect(click.errors[:target_url]).to be_present
    end

    it 'exige click_token_signature' do
      click = described_class.new(base_attributes.merge(click_token_signature: nil))
      expect(click).not_to be_valid
      expect(click.errors[:click_token_signature]).to be_present
    end
  end

  describe 'anonymization helpers' do
    describe '.anonymize_ip' do
      it 'anonimiza endereço IP gerando hash SHA256 com salt e sem armazenar IP bruto' do
        hash1 = described_class.anonymize_ip('192.168.1.100')
        hash2 = described_class.anonymize_ip('192.168.1.100')
        hash_diff = described_class.anonymize_ip('10.0.0.1')

        expect(hash1).to be_a(String)
        expect(hash1.length).to eq(64)
        expect(hash1).not_to include('192.168.1.100')
        expect(hash1).to eq(hash2)
        expect(hash1).not_to eq(hash_diff)
      end

      it 'retorna nil para IP em branco' do
        expect(described_class.anonymize_ip(nil)).to be_nil
        expect(described_class.anonymize_ip('')).to be_nil
      end
    end

    describe '.hash_user_agent' do
      it 'gera hash SHA256 do user agent' do
        ua_hash = described_class.hash_user_agent('Mozilla/5.0 (Windows NT 10.0; Win64; x64)')
        expect(ua_hash).to be_a(String)
        expect(ua_hash.length).to eq(64)
      end

      it 'retorna nil para user agent em branco' do
        expect(described_class.hash_user_agent(nil)).to be_nil
        expect(described_class.hash_user_agent('')).to be_nil
      end
    end
  end
end
