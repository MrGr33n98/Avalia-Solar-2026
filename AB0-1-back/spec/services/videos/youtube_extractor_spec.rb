# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Videos::YoutubeExtractor do
  describe '.extract' do
    it 'normalizes accepted YouTube URL forms' do
      [
        'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        'https://youtu.be/dQw4w9WgXcQ',
        'https://www.youtube.com/shorts/dQw4w9WgXcQ'
      ].each do |url|
        expect(described_class.extract(url)).to include(
          valid: true,
          provider: 'youtube',
          video_id: 'dQw4w9WgXcQ',
          thumbnail_url: 'https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg'
        )
      end
    end

    it 'rejects non-YouTube, malformed and non-HTTPS URLs' do
      [
        'https://vimeo.com/123456789',
        'http://youtube.com/watch?v=dQw4w9WgXcQ',
        'https://youtube.com/watch?v=too-short',
        'not a url'
      ].each do |url|
        result = described_class.extract(url)
        expect(result[:valid]).to be(false)
        expect(result[:error]).to be_present
      end
    end
  end
end
