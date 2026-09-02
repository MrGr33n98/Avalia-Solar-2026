require 'rails_helper'

RSpec.describe Sales::QuoteRenderer do
  it 'escapa conteúdo e produz documento HTML' do
    quote = instance_double(Sales::Quote, number: 'Q-1', status: 'draft', total_cents: 100,
                             items: [instance_double(Sales::QuoteItem, description: '<script>', quantity: 1, total_cents: 100)])
    html = described_class.call(quote: quote)
    expect(html).to include('&lt;script&gt;')
    expect(html).not_to include('<script>')
  end
end
