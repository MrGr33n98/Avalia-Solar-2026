STDERR.sync = true
def log(m); STDERR.puts "#{Process.clock_gettime(Process::CLOCK_MONOTONIC)} #{m}"; STDERR.flush; end
log 'START'
require './config/boot'; log "BOOT bootsnap=#{defined?(Bootsnap).inspect} loaded=#{$LOADED_FEATURES.grep(/bootsnap/).any?}"
require './config/application'; log "APPLICATION i18n=#{I18n.load_path.length}"
before=I18n.load_path.length; I18n.load_path.reject! { |p| p.to_s.include?('/faker-') || p.to_s.include?('/faker/') }; log "FAKER_REMOVED before=#{before} removed=#{before-I18n.load_path.length} after=#{I18n.load_path.length}"
Rails.application.config.eager_load=true
Thread.new { [5,10,20,30,45,60].each { |s| sleep s; log "WATCHDOG #{s}s features=#{$LOADED_FEATURES.length} stack=#{Thread.main.backtrace&.first(8)&.join(' <- ')}" } }
log 'BEFORE_INITIALIZE'; Rails.application.initialize!; log 'BOOT OK'
