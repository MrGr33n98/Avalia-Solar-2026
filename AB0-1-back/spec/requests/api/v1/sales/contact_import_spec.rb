require 'rails_helper'

RSpec.describe 'Sales contact import contract' do
  it 'mantém o endpoint de criação de contatos disponível' do
    route = Rails.application.routes.routes.find do |candidate|
      candidate.path.spec.to_s == '/api/v1/sales/contacts(.:format)'
    end

    expect(route).not_to be_nil
  end

  it 'possui índice único para merge por conta e e-mail' do
    indexes = ActiveRecord::Base.connection.indexes(:sales_contacts)
    index = indexes.find { |candidate| candidate.name == 'index_sales_contacts_on_account_and_normalized_email' }

    expect(index).not_to be_nil
    expect(index.unique).to be(true)
  end
end
