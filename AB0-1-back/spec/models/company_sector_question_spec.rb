require 'rails_helper'

RSpec.describe CompanySectorQuestion, type: :model do
  let(:company) { create(:company) }

  it 'is valid with prompt, weight, and order' do
    question = build(:company_sector_question, company: company, prompt: 'Teste', weight: 3, order: 1)
    expect(question).to be_valid
  end

  it 'enforces weight between 1 and 5' do
    question = build(:company_sector_question, company: company, prompt: 'Teste', weight: 6)
    expect(question).not_to be_valid
    expect(question.errors[:weight]).to include('is not included in the list')
  end

  it 'auto populates order if missing' do
    create(:company_sector_question, company: company, order: 1)
    question = build(:company_sector_question, company: company, prompt: 'Nova')
    question.valid?
    expect(question.order).to eq(2)
  end

  it 'allowlists ransack associations to keep ActiveAdmin index stable' do
    expect(described_class.ransackable_associations).to include('company')
    expect(described_class.ransackable_attributes).to include('company_id')
  end
end
