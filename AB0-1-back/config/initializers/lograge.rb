Rails.application.configure do
  # TASK-008: Structured logging with Lograge
  config.lograge.enabled = true
  config.lograge.base_controller_class = ['ActionController::API', 'ActionController::Base']
  
  # Format logs as JSON for easy parsing by ELK/Datadog
  config.lograge.formatter = Lograge::Formatters::Json.new
  
  # Add custom data to the log event
  config.lograge.custom_options = lambda do |event|
    {
      time: Time.current.iso8601,
      params: event.payload[:params].to_h.except('controller', 'action', 'format'),
      request_id: event.payload[:request_id].presence ||
        event.payload[:headers].to_h['HTTP_X_REQUEST_ID'].presence ||
        event.payload[:request]&.request_id,
      exception: event.payload[:exception]&.first,
      exception_message: event.payload[:exception]&.last,
      user_id: event.payload[:user_id], # Requires controller instrumentation
      remote_ip: event.payload[:remote_ip],
      user_agent: event.payload[:user_agent]
    }
  end

  # Log exceptions
  config.lograge.custom_payload do |controller|
    {
      user_id: (controller.respond_to?(:current_user, true) && controller.request.env['warden']) ? controller.send(:current_user)&.id : nil,
      remote_ip: controller.request.remote_ip,
      user_agent: controller.request.user_agent
    }
  end
end
