# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Mcp::Public::TrustPreviewSnapshot do
  it 'includes only published FAQ when enabled and excludes inactive badges' do
    company = create(:company, status: :active)
    allow(company).to receive(:feature_access).and_return('faq_block' => { 'state' => 'enabled', 'value' => true })
    company.company_faqs.create!(question: 'Pergunta pública', answer: 'Resposta pública', status: 'published', position: 1)
    company.company_faqs.create!(question: 'Privada', answer: 'Rascunho', status: 'draft', position: 2)
    company.badges << Badge.create!(name: 'Selo público', active: true)
    company.badges << Badge.create!(name: 'Selo inativo', active: false)
    result = described_class.call(company)
    expect(result[:state]).to eq('ready')
    expect(result[:faqs].map { |faq| faq[:question] }).to eq(['Pergunta pública'])
    expect(result[:badges].map { |badge| badge[:name] }).to eq(['Selo público'])
  end

  it 'does not expose FAQ if the plan feature is locked' do
    company = create(:company, status: :active)
    allow(company).to receive(:feature_access).and_return('faq_block' => { 'state' => 'locked', 'value' => false })
    company.company_faqs.create!(question: 'Privada', answer: 'Resposta', status: 'published', position: 1)
    expect(described_class.call(company)[:faqs]).to eq([])
  end
end
