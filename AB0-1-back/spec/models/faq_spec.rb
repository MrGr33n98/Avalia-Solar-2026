require 'rails_helper'

RSpec.describe Faq, type: :model do
  it 'is valid with question, answer and category' do
    faq = described_class.new(question: 'Como funciona?', answer: 'Via painel', category: 'geral')
    expect(faq).to be_valid
  end

  it 'is invalid without question' do
    faq = described_class.new(answer: 'Via painel', category: 'geral')
    expect(faq).not_to be_valid
  end

  it 'scopes active ordered' do
    faq1 = described_class.create!(question: 'A', answer: '1', category: 'geral', position: 2, active: true)
    faq2 = described_class.create!(question: 'B', answer: '2', category: 'geral', position: 1, active: true)
    described_class.create!(question: 'C', answer: '3', category: 'geral', position: 0, active: false)

    expect(Faq.active.ordered).to eq([faq2, faq1])
  end
end
