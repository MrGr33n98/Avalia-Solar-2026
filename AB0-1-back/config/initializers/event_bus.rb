Rails.application.config.after_initialize do
  ActiveSupport::Notifications.subscribe(/.*/) do |*args|
    # Double check for dispatcher existence to be extra safe during reloads
    EventDispatcher.dispatch(*args) if defined?(EventDispatcher)
  end
end
