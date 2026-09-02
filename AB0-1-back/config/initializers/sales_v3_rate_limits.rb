# frozen_string_literal: true

class Rack::Attack
  throttle('sales_mutations/ip', limit: 60, period: 1.minute) do |req|
    req.ip if req.path.start_with?('/api/v1/sales/') && req.post?
  end

  throttle('sales_tracking/ip', limit: 240, period: 1.minute) do |req|
    req.ip if req.path == '/api/v1/sales/tracking_events' && req.post?
  end
end
