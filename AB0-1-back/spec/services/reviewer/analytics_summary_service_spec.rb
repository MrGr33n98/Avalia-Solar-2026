# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Reviewer::AnalyticsSummaryService do
  include ActiveSupport::Testing::TimeHelpers

  let(:user) { create(:user, role: 'review') }
  let(:profile) { create(:reviewer_profile, user: user, tree_views_count: 5) }
  let(:publication) { create(:reviewer_publication, user: user) }

  around do |example|
    travel_to(Time.zone.local(2026, 8, 20, 12)) { example.run }
  end

  it 'retorna valores reais e preenche com zero somente dias sem eventos' do
    create_view(publication, created_at: Time.current)
    create_view(publication, created_at: 2.hours.ago)
    create_view(publication, created_at: 2.days.ago)
    create_view(publication, created_at: 8.days.ago)
    create_view(create(:reviewer_publication), created_at: Time.current)
    SocialFollow.create!(follower: create(:user, role: 'review'), followable: profile)

    result = described_class.new(user: user, profile: profile).call

    expect(result).to include(views: 9, followers: 1, clicks: 0)
    expect(result[:daily_views]).to eq(
      [
        { date: '14/08', views: 0 },
        { date: '15/08', views: 0 },
        { date: '16/08', views: 0 },
        { date: '17/08', views: 0 },
        { date: '18/08', views: 1 },
        { date: '19/08', views: 0 },
        { date: '20/08', views: 2 }
      ]
    )
  end

  it 'agrega os sete dias em uma única query agrupada' do
    create_view(publication, created_at: Time.current)
    sql_queries = capture_event_queries do
      described_class.new(user: user, profile: profile).call
    end

    grouped_queries = sql_queries.grep(/GROUP BY.*DATE\(reviewer_publication_events\.created_at\)/i)
    expect(grouped_queries.size).to eq(1)
  end

  private

  def create_view(target_publication, created_at:)
    ReviewerPublicationEvent.create!(
      reviewer_publication: target_publication,
      event_name: 'publication_view',
      created_at: created_at,
      updated_at: created_at
    )
  end

  def capture_event_queries
    queries = []
    subscriber = ActiveSupport::Notifications.subscribe('sql.active_record') do |*, payload|
      sql = payload[:sql]
      queries << sql if sql.include?('reviewer_publication_events')
    end

    yield
    queries
  ensure
    ActiveSupport::Notifications.unsubscribe(subscriber) if subscriber
  end
end
