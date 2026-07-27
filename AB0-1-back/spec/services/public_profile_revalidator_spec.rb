require 'rails_helper'

RSpec.describe PublicProfileRevalidator do
  let(:company) { create(:company, slug: 'empresa-de-teste') }

  around do |example|
    original_url = ENV['NEXT_REVALIDATE_URL']
    original_secret = ENV['NEXT_REVALIDATE_SECRET']
    example.run
  ensure
    ENV['NEXT_REVALIDATE_URL'] = original_url
    ENV['NEXT_REVALIDATE_SECRET'] = original_secret
  end

  it 'is a no-op when no public invalidation endpoint is configured' do
    ENV.delete('NEXT_REVALIDATE_URL')
    ENV.delete('NEXT_REVALIDATE_SECRET')

    expect(described_class.call!(company)).to eq(false)
  end

  it 'raises when Next.js refuses an invalidation so the job can retry' do
    ENV['NEXT_REVALIDATE_URL'] = 'https://frontend.example.test/api/revalidate'
    ENV['NEXT_REVALIDATE_SECRET'] = 'secret'
    response = Net::HTTPUnauthorized.new('1.1', '401', 'Unauthorized')
    http = instance_double(Net::HTTP, request: response)
    allow(Net::HTTP).to receive(:start).and_yield(http)

    expect { described_class.call!(company) }.to raise_error(PublicProfileRevalidator::Error, /HTTP 401/)
  end

  it 'invalidates the exact slug tag used by the public profile route' do
    ENV['NEXT_REVALIDATE_URL'] = 'https://frontend.example.test/api/revalidate'
    ENV['NEXT_REVALIDATE_SECRET'] = 'secret'
    response = Net::HTTPOK.new('1.1', '200', 'OK')
    request_sent = nil
    http = instance_double(Net::HTTP)
    allow(http).to receive(:request) do |request|
      request_sent = request
      response
    end
    allow(Net::HTTP).to receive(:start).and_yield(http)

    expect(described_class.call!(company)).to eq(true)

    payload = JSON.parse(request_sent.body)
    expect(payload.fetch('paths')).to eq(['/companies/empresa-de-teste'])
    expect(payload.fetch('tags')).to include('company-profile', 'company-empresa-de-teste')
  end
end
