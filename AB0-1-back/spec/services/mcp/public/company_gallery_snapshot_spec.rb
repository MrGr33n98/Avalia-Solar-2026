# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Mcp::Public::CompanyGallerySnapshot do
  let(:company) { create(:company, status: :active) }

  it 'uses only the public photo accessor and explicit HTTPS origins' do
    allow(ENV).to receive(:[]).and_call_original
    allow(ENV).to receive(:[]).with('MCP_UI_RESOURCE_DOMAINS').and_return('https://api.avaliasolar.com.br')
    allow(company).to receive(:media_urls).and_return([
      'https://api.avaliasolar.com.br/public.png',
      'http://api.avaliasolar.com.br/insecure.png',
      'https://untrusted.example/private.png'
    ])
    expect(described_class.call(company)).to eq(
      state: 'ready', images: ['https://api.avaliasolar.com.br/public.png'], videos: []
    )
  end

  it 'exposes published videos only for the requested company' do
    company.company_videos.create!(provider: 'youtube', video_id: 'a1234567890',
                                   url: 'https://www.youtube.com/watch?v=a1234567890', status: 'published')
    company.company_videos.create!(provider: 'youtube', video_id: 'b1234567890',
                                   url: 'https://www.youtube.com/watch?v=b1234567890', status: 'pending')
    expect(described_class.call(company)[:videos].map { |item| item[:url] }).to eq(
      ['https://www.youtube.com/watch?v=a1234567890']
    )
  end
end
