require 'rails_helper'

RSpec.describe Sales::WebhookDispatcher do
  it 'cria delivery para endpoint inscrito' do
    endpoint = instance_double(Sales::WebhookEndpoint, active?: true, events: ['sales.account.created'], deliveries: double)
    allow(Sales::WebhookEndpoint).to receive(:where).and_return([endpoint])
    delivery = instance_double(Sales::WebhookDelivery, id: 42)
    allow(endpoint.deliveries).to receive(:create!).and_return(delivery)
    allow(Sales::DeliverWebhookJob).to receive(:perform_later)

    described_class.call(event_type: 'sales.account.created', payload: { id: 1 })

    expect(Sales::DeliverWebhookJob).to have_received(:perform_later).with(42, { id: 1 })
  end
end
