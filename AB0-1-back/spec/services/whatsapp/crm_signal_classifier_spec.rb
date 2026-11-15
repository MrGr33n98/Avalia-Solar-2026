# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Whatsapp::CRMSignalClassifier do
  it 'detects commercial pricing interest without invoking an LLM' do
    expect(described_class.call('Quais são os planos do Avalia Solar?')).to eq('pricing_requested')
  end

  it 'detects human requests' do
    expect(described_class.call('Quero falar com um atendente')).to eq('human_requested')
  end

  it 'detects company registration' do
    expect(described_class.call('Quero cadastrar minha empresa')).to eq('registration_started')
  end

  it 'detects claim requests' do
    expect(described_class.call('REIVINDICAR')).to eq('company_claim_requested')
  end

  it 'does not turn a consumer review into a sales signal' do
    expect(described_class.call('Quero avaliar a instalação e dar cinco estrelas')).to be_nil
  end

  it 'does not interpret an unstructured phone message as a lead' do
    expect(described_class.call('Oi, tudo bem?')).to be_nil
  end
end
