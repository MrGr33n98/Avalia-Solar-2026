# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Company, 'Outbound Destination Security (Anti-Open-Redirect)', type: :model do
  let(:company) do
    described_class.new(
      name: 'Empresa Solar Alpha',
      website: 'https://solaralpha.com.br',
      cta_primary_url: 'https://contato.solaralpha.com.br/orcamento',
      cta_secondary_url: 'https://solaralpha.com.br/whatsapp'
    )
  end

  describe '#authorized_outbound_origins' do
    it 'extrai e normaliza as origens oficiais autorizadas dos links da empresa' do
      origins = company.authorized_outbound_origins

      expect(origins).to include('https://solaralpha.com.br')
      expect(origins).to include('https://contato.solaralpha.com.br')
    end

    it 'inclui allowed_origins de sales_tracking_site quando configurado' do
      tracking_site = instance_double(
        Sales::TrackingSite,
        allowed_origins: ['https://landing.solaralpha.com.br', 'https://app.solaralpha.com.br']
      )
      allow(company).to receive(:sales_tracking_site).and_return(tracking_site)

      origins = company.authorized_outbound_origins
      expect(origins).to include('https://landing.solaralpha.com.br')
      expect(origins).to include('https://app.solaralpha.com.br')
    end
  end

  describe '#valid_outbound_url?' do
    it 'aceita URLs pertencentes às origens autorizadas da empresa' do
      expect(company.valid_outbound_url?('https://solaralpha.com.br')).to be(true)
      expect(company.valid_outbound_url?('https://solaralpha.com.br/produtos/paineis')).to be(true)
      expect(company.valid_outbound_url?('https://contato.solaralpha.com.br/orcamento?ref=promo')).to be(true)
    end

    it 'bloqueia tentativas de Open Redirect para domínios externos arbitrários' do
      expect(company.valid_outbound_url?('https://evil-phishing.com')).to be(false)
      expect(company.valid_outbound_url?('https://google.com')).to be(false)
      expect(company.valid_outbound_url?('https://solaralpha.com.br.attacker.com')).to be(false)
    end

    it 'bloqueia URLs com credenciais (userinfo bypass)' do
      expect(company.valid_outbound_url?('https://solaralpha.com.br@attacker.com')).to be(false)
      expect(company.valid_outbound_url?('https://user:pass@solaralpha.com.br')).to be(false)
    end

    it 'bloqueia esquemas perigosos (javascript:, data:, file:)' do
      expect(company.valid_outbound_url?('javascript:alert(1)')).to be(false)
      expect(company.valid_outbound_url?('data:text/html,<script>alert(1)</script>')).to be(false)
      expect(company.valid_outbound_url?('file:///etc/passwd')).to be(false)
    end

    it 'retorna false para valores nulos, vazios ou malformados' do
      expect(company.valid_outbound_url?(nil)).to be(false)
      expect(company.valid_outbound_url?('')).to be(false)
      expect(company.valid_outbound_url?('   ')).to be(false)
      expect(company.valid_outbound_url?('htp:/not-a-valid-url')).to be(false)
    end
  end

  describe '#resolve_outbound_destination' do
    it 'resolve URL padrão de website' do
      expect(company.resolve_outbound_destination(destination_type: 'website')).to eq('https://solaralpha.com.br')
    end

    it 'resolve CTA primário e secundário' do
      expect(company.resolve_outbound_destination(destination_type: 'cta_primary')).to eq('https://contato.solaralpha.com.br/orcamento')
      expect(company.resolve_outbound_destination(destination_type: 'cta_secondary')).to eq('https://solaralpha.com.br/whatsapp')
    end

    it 'permite custom_url se e somente se pertencer a uma origem autorizada' do
      valid_custom = 'https://solaralpha.com.br/campanha-especial'
      expect(company.resolve_outbound_destination(custom_url: valid_custom)).to eq(valid_custom)

      invalid_custom = 'https://site-externo-nao-autorizado.com/roubo'
      expect(company.resolve_outbound_destination(custom_url: invalid_custom)).to be_nil
    end
  end
end
