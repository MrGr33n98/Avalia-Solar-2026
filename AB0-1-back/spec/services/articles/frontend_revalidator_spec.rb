# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Articles::FrontendRevalidator do
  around do |example|
    original_url = ENV['NEXT_REVALIDATE_URL']
    original_secret = ENV['NEXT_REVALIDATE_SECRET']
    example.run
  ensure
    ENV['NEXT_REVALIDATE_URL'] = original_url
    ENV['NEXT_REVALIDATE_SECRET'] = original_secret
  end

  it 'does nothing when the frontend revalidation endpoint is not configured' do
    ENV.delete('NEXT_REVALIDATE_URL')
    ENV.delete('NEXT_REVALIDATE_SECRET')

    expect(described_class.call!('plano-founder-avalia-solar')).to eq(false)
  end

  it 'invalidates only the article slugs and cache tags provided' do
    ENV['NEXT_REVALIDATE_URL'] = 'https://frontend.example.test/api/revalidate'
    ENV['NEXT_REVALIDATE_SECRET'] = 'test-secret'
    response = Net::HTTPOK.new('1.1', '200', 'OK')
    request_sent = nil
    http = instance_double(Net::HTTP)
    allow(http).to receive(:request) do |request|
      request_sent = request
      response
    end
    allow(Net::HTTP).to receive(:start).and_yield(http)

    expect(described_class.call!(%w[old-founder-slug plano-founder-avalia-solar])).to eq(true)

    expect(request_sent['Authorization']).to eq('Bearer test-secret')
    expect(JSON.parse(request_sent.body)).to eq(
      'paths' => ['/blog/old-founder-slug', '/blog/plano-founder-avalia-solar'],
      'tags' => ['articles', 'article-old-founder-slug', 'article-plano-founder-avalia-solar']
    )
  end

  it 'rejects unsafe slugs without making a request' do
    ENV['NEXT_REVALIDATE_URL'] = 'https://frontend.example.test/api/revalidate'
    ENV['NEXT_REVALIDATE_SECRET'] = 'test-secret'
    expect(Net::HTTP).not_to receive(:start)

    expect(described_class.call!('../admin')).to eq(false)
  end

  it 'raises when the frontend rejects the invalidation so the job can retry' do
    ENV['NEXT_REVALIDATE_URL'] = 'https://frontend.example.test/api/revalidate'
    ENV['NEXT_REVALIDATE_SECRET'] = 'test-secret'
    response = Net::HTTPUnauthorized.new('1.1', '401', 'Unauthorized')
    http = instance_double(Net::HTTP, request: response)
    allow(Net::HTTP).to receive(:start).and_yield(http)

    expect do
      described_class.call!('plano-founder-avalia-solar')
    end.to raise_error(Articles::FrontendRevalidator::Error, /HTTP 401/)
  end
end
