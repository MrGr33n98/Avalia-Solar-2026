# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Whatsapp::ConversationRouter do
  let(:contact) { '5511988887777@c.us' }
  let(:gateway) { instance_double(VoiceReviews::ContinuationLink::FakeGateway) }

  before do
    allow(VoiceReviews::ContinuationLink).to receive(:gateway).and_return(gateway)
    allow(gateway).to receive(:send_message)
  end

  it 'presents the welcome menu on spontaneous greeting (FLOW-001)' do
    expect(gateway).to receive(:send_message).with(
      anything,
      /Sou o assistente oficial do \*Avalia Solar\*/
    )

    result = described_class.call(
      provider: 'waha',
      provider_session: 'avalia-solar-voice',
      contact: contact,
      message: { 'id' => 'msg-menu-1', 'text' => 'Olá, bom dia!', 'sender_name' => 'Ana' }
    )

    expect(result).to be true
  end

  it 'returns Brand Page information and canonical /companies/ link when asked about company profile (FLOW-007)' do
    company = create(:company, name: 'Solar Tech Brasil', cnpj: '11222333000181', status: 'active', city: 'Cuiabá', state: 'MT')

    expect(gateway).to receive(:send_message).with(
      anything,
      satisfy { |msg|
        msg.include?('Solar Tech Brasil') &&
          msg.include?("https://www.avaliasolar.com.br/companies/#{company.slug.presence || company.id}")
      }
    )

    described_class.call(
      provider: 'waha',
      provider_session: 'avalia-solar-voice',
      contact: contact,
      message: { 'id' => 'msg-brand-1', 'text' => 'Ver perfil da empresa Solar Tech Brasil' }
    )
  end

  it 'returns commercial plans overview when asked about plans or pricing (FLOW-008)' do
    expect(gateway).to receive(:send_message).with(
      anything,
      /Planos & Destaque para Integradores — Avalia Solar/
    )

    described_class.call(
      provider: 'waha',
      provider_session: 'avalia-solar-voice',
      contact: contact,
      message: { 'id' => 'msg-plans-1', 'text' => 'Quais são os planos pagos para destacar minha empresa?' }
    )
  end

  it 'escalates to human support when user asks for AJUDA or ATENDENTE (FLOW-009)' do
    onboarding = B2b::OnboardingSessionService.open!(contact: contact)

    expect(gateway).to receive(:send_message).with(
      anything,
      satisfy { |msg|
        msg.include?('Atendimento Humano — Avalia Solar') &&
          msg.include?('growth@avaliasolar.com.br')
      }
    )

    described_class.call(
      provider: 'waha',
      provider_session: 'avalia-solar-voice',
      contact: contact,
      message: { 'id' => 'msg-help-1', 'text' => 'Quero falar com uma pessoa' }
    )

    expect(onboarding.reload.state).to eq('needs_human_review')
  end

  describe 'roteamento de números do menu (BUGFIX-NUMERIC-ROUTING)' do
    it 'roteia dígito 5 para apresentação de planos comerciais (sem acionar atendimento humano)' do
      expect(gateway).to receive(:send_message).with(
        anything,
        satisfy { |msg|
          msg.include?('Planos & Destaque para Integradores') &&
            !msg.include?('Atendimento Humano')
        }
      )

      described_class.call(
        provider: 'waha',
        provider_session: 'avalia-solar-voice',
        contact: contact,
        message: { 'id' => 'msg-num-5', 'text' => '5' }
      )
    end

    it 'roteia dígito 4 para prompt interativo de consulta de perfil' do
      expect(gateway).to receive(:send_message).with(
        anything,
        satisfy { |msg|
          msg.include?('Consultar Perfil de Empresa') &&
            msg.include?('CNPJ da empresa')
        }
      )

      described_class.call(
        provider: 'waha',
        provider_session: 'avalia-solar-voice',
        contact: contact,
        message: { 'id' => 'msg-num-4', 'text' => '4' }
      )
    end

    it 'roteia dígito 1 para instruções de avaliação de empresa' do
      expect(gateway).to receive(:send_message).with(
        anything,
        satisfy { |msg|
          msg.include?('Avaliar uma Empresa de Energia Solar') &&
            msg.include?('Avaliar [Nome da Empresa]')
        }
      )

      described_class.call(
        provider: 'waha',
        provider_session: 'avalia-solar-voice',
        contact: contact,
        message: { 'id' => 'msg-num-1', 'text' => '1' }
      )
    end
  end
end
