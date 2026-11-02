# frozen_string_literal: true

require 'test_helper'

module ReviewForms
  class SourceNormalizerTest < ActiveSupport::TestCase
    test 'normalizes valid canonical channels' do
      %w[link qr whatsapp email widget].each do |channel|
        assert_equal channel, SourceNormalizer.call(channel)
        assert_equal channel, SourceNormalizer.call(channel.upcase)
        assert_equal channel, SourceNormalizer.call("  #{channel}  ")
      end
    end

    test 'falls back to link for invalid or empty channels' do
      assert_equal 'link', SourceNormalizer.call(nil)
      assert_equal 'link', SourceNormalizer.call('')
      assert_equal 'link', SourceNormalizer.call('unknown_source')
      assert_equal 'link', SourceNormalizer.call('<script>alert(1)</script>')
    end

    test 'respects allow_internal parameter for dashboard events' do
      assert_equal 'link', SourceNormalizer.call('dashboard')
      assert_equal 'dashboard', SourceNormalizer.call('dashboard', allow_internal: true)
    end
  end
end

