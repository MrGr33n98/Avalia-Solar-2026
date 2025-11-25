# frozen_string_literal: true

# TASK-007: Scout APM Initialization
# Documentation: https://docs.scoutapm.com/ruby/

# Scout APM is automatically initialized from config/scout_apm.yml
# This file is for custom instrumentation and configuration

# Custom instrumentation example
module ScoutApmInstrumentation
  # Instrument a specific method
  def self.instrument_method(klass, method_name, metric_name = nil)
    metric_name ||= "Custom/#{klass.name}/#{method_name}"
    
    klass.class_eval do
      alias_method "#{method_name}_without_scout", method_name
      
      define_method(method_name) do |*args, &block|
        ScoutApm::Transaction.start_layer(ScoutApm::Layer.new('Custom', metric_name))
        send("#{method_name}_without_scout", *args, &block)
      ensure
        ScoutApm::Transaction.stop_layer
      end
    end
  end
end

# Example: Instrument a specific service class
# ScoutApmInstrumentation.instrument_method(OrderService, :process)

# Add custom context to all requests
if defined?(ScoutApm)
  if ScoutApm::Context.respond_to?(:add_user)
    ScoutApm::Context.add_user(id: nil) # Will be set per request
  end

  # Global context
  if ScoutApm::Context.respond_to?(:add)
    context_data = {
      environment: Rails.env,
      ruby_version: RUBY_VERSION,
      rails_version: Rails.version
    }
    ScoutApm::Context.add(context_data)
  end
  
  Rails.logger.info "[SCOUT APM] Initialized with key: #{ENV['SCOUT_KEY']&.present? ? 'configured' : 'missing'}"
end

# ActiveSupport instrumentation
ActiveSupport::Notifications.subscribe('process_action.action_controller') do |name, started, finished, unique_id, data|
  # Add custom tracking here if needed
  if data[:status] && data[:status] >= 500
    Rails.logger.error "[APM] 5xx Error: #{data[:controller]}##{data[:action]} - Status: #{data[:status]}"
  end
end

# Instrument Sidekiq jobs automatically
if defined?(Sidekiq)
  ScoutApm::Sidekiq.enable if defined?(ScoutApm::Sidekiq)
end
