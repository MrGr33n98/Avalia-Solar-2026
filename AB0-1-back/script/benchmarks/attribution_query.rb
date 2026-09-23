# frozen_string_literal: true

# Executar somente em dev/test com banco descartável ou cópia segura:
# bin/rails runner script/benchmarks/attribution_query.rb
require 'benchmark'

company_id = ENV.fetch('COMPANY_ID')
from_time = Time.zone.parse(ENV.fetch('FROM', 30.days.ago.iso8601))
to_time = Time.zone.parse(ENV.fetch('TO', Time.current.iso8601))
limit = Integer(ENV.fetch('LIMIT', '20'))

scope = AnalyticsEvent.where(company_id: company_id, tracked_at: from_time..to_time)
                     .where(event_type: Analytics::EventTaxonomy.aliases_for('profile_view') +
                               Analytics::EventTaxonomy.aliases_for('cta_click') +
                               Analytics::EventTaxonomy.aliases_for('lead_created'))

puts({ company_id:, from_time:, to_time:, rows: scope.count, limit: }.inspect)
puts 'EXPLAIN:'
puts scope.explain

%w[first_touch last_touch].each do |model|
  elapsed = Benchmark.realtime do
    Analytics::AttributionQuery.call(company_id:, from_time:, to_time:, attribution_model: model, limit:)
  end
  puts({ attribution_model: model, elapsed_ms: (elapsed * 1000).round(2) }.inspect)
end
