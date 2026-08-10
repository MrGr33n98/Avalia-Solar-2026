# frozen_string_literal: true

require 'rails_helper'

RSpec.describe BannerEvent, type: :model, use_transactional_fixtures: false do
  it 'mantem uma linha quando duas threads gravam a mesma chave' do
    banner = create(:banner, :approved, active: true, position: 'compare_hero')
    event_key = Digest::SHA256.hexdigest("#{banner.id}:impression:concurrent-1")
    barrier = Queue.new

    threads = 2.times.map do
      Thread.new do
        barrier.pop
        BannerEvent.create_or_find_by!(event_key: event_key) do |event|
          event.banner = banner
          event.event_type = 'impression'
          event.tracked_at = Time.current
          event.valid_for_reporting = true
          event.fraud_score = 0
        end
      end
    end

    2.times { barrier << true }
    threads.each(&:join)

    expect(BannerEvent.where(event_key: event_key).count).to eq(1)
  end
end
