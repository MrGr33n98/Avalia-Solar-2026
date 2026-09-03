STDERR.sync=true
def log(x); STDERR.puts "#{Process.clock_gettime(Process::CLOCK_MONOTONIC)} #{x}"; end
require './config/boot'; log "BOOT bootsnap=#{defined?(Bootsnap).inspect} loaded=#{$LOADED_FEATURES.grep(/bootsnap/).any?}"
require './config/application'; log 'APPLICATION'
if ENV['AA_OFF']=='1'
  ActiveAdmin.application.load_paths = [] if defined?(ActiveAdmin)
  log 'ACTIVEADMIN_FILES=OFF'
else
  log 'ACTIVEADMIN_FILES=ON'
end
Rails.application.config.eager_load=true
Thread.new { sleep 10; log "WATCHDOG features=#{$LOADED_FEATURES.length} stack=#{Thread.main.backtrace&.first(10)&.join(' <- ')}" }
log 'BEFORE_INITIALIZE'; Rails.application.initialize!; log 'BOOT OK'
