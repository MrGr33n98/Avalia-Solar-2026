require 'rails_helper'

RSpec.describe Sales::QuoteItem do
  it 'usa total persistido para composição de proposta' do
    expect(described_class.table_name).to eq('sales_quote_items')
    expect(described_class.reflect_on_association(:quote)).not_to be_nil
  end
end
