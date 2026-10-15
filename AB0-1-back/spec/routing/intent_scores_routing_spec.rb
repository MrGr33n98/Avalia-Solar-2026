# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'IntentScores routing', type: :routing do
  it 'routes GET /api/v1/intent_scores to index' do
    expect(get: '/api/v1/intent_scores').to route_to(
      controller: 'api/v1/intent_scores',
      action: 'index'
    )
  end

  it 'routes GET /api/v1/intent_scores/:id to show' do
    expect(get: '/api/v1/intent_scores/123').to route_to(
      controller: 'api/v1/intent_scores',
      action: 'show',
      id: '123'
    )
  end

  it 'routes GET /api/v1/intent_scores/reporting to reporting' do
    expect(get: '/api/v1/intent_scores/reporting').to route_to(
      controller: 'api/v1/intent_scores',
      action: 'reporting'
    )
  end

  it 'routes GET /api/v1/intent_scores/summary to summary' do
    expect(get: '/api/v1/intent_scores/summary').to route_to(
      controller: 'api/v1/intent_scores',
      action: 'summary'
    )
  end

  it 'routes GET /api/v1/intent_scores/export_csv to export_csv' do
    expect(get: '/api/v1/intent_scores/export_csv').to route_to(
      controller: 'api/v1/intent_scores',
      action: 'export_csv'
    )
  end

  it 'routes GET /api/v1/intent_scores/export_detail_csv to export_detail_csv' do
    expect(get: '/api/v1/intent_scores/export_detail_csv').to route_to(
      controller: 'api/v1/intent_scores',
      action: 'export_detail_csv'
    )
  end

  it 'routes POST /api/v1/intent_scores/recalculate to recalculate' do
    expect(post: '/api/v1/intent_scores/recalculate').to route_to(
      controller: 'api/v1/intent_scores',
      action: 'recalculate'
    )
  end
end
