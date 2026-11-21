# frozen_string_literal: true

require 'rails_helper'

RSpec.describe CompanyAi::KnowledgeRetriever do
  it 'rejects inactive companies without querying content' do
    company = instance_double(Company, status: 'inactive')
    expect(described_class.call(company: company)).to eq([])
  end

  it 'does not read uploaded documents without an approved extraction pipeline' do
    company = instance_double(Company, status: 'active')
    faqs = double('published_only')
    allow(company).to receive(:company_faqs).and_return(faqs)
    allow(faqs).to receive(:published_only).and_return(faqs)
    allow(faqs).to receive(:order).and_return(faqs)
    allow(faqs).to receive(:limit).and_return([])
    products = double('visible')
    allow(company).to receive(:company_products).and_return(products)
    allow(products).to receive(:visible).and_return(products)
    allow(products).to receive(:select).with(:product_id).and_return([])
    allow(Product).to receive(:where).with(id: []).and_return(Product.none)
    expect(described_class.call(company: company)).to eq([])
  end
end
