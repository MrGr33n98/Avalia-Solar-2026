begin
  require_relative 'config/environment'
  ActiveRecord::Base.connection.migration_context.migrate
  puts "Migration successful!"
rescue => e
  puts "Migration failed: #{e.message}"
  puts e.backtrace
end
