STDERR.sync = true
require 'fileutils'

probe_log = ENV.fetch('BOOT_PROBE_LOG', '/tmp/boot_probe.log')
FileUtils.rm_f(probe_log)

def probe_log(path, message)
  line = "#{Process.clock_gettime(Process::CLOCK_MONOTONIC)} pid=#{Process.pid} #{message}\n"
  STDERR.write(line)
  File.open(path, 'a') { |f| f.write(line); f.flush; f.fsync }
end

def probe_stack(thread)
  (thread.backtrace || []).select { |f| f.include?('/app/') || f.include?('/gems/') }.first(12)
end

skip_bootsnap = ENV['BOOT_PROBE_BOOTSNAP'] == 'off'
if skip_bootsnap
  module Kernel
    alias_method :probe_original_require, :require
    def require(path)
      return false if path == 'bootsnap/setup'
      probe_original_require(path)
    end
  end
end

probe_log(probe_log, 'BOOT_PROBE_START')
probe_log(probe_log, 'BEFORE_REQUIRE_BOOT')
require './config/boot'
probe_log(probe_log, "AFTER_REQUIRE_BOOT bootsnap=#{defined?(Bootsnap).inspect} bootsnap_loaded=#{$LOADED_FEATURES.grep(/bootsnap/).any?}")
probe_log(probe_log, 'BEFORE_REQUIRE_APPLICATION')
require './config/application'
probe_log(probe_log, 'AFTER_REQUIRE_APPLICATION')

eager = ENV.fetch('BOOT_PROBE_EAGER', 'on') == 'on'
Rails.application.config.eager_load = eager
probe_log(probe_log, "BEFORE_INITIALIZE EAGER_LOAD=#{Rails.application.config.eager_load}")

main = Thread.current
start = Process.clock_gettime(Process::CLOCK_MONOTONIC)
last_features = $LOADED_FEATURES.dup
watchdog = Thread.new do
  [5, 10, 15, 20, 30, 45, 60].each do |sec|
    sleep [sec - (Process.clock_gettime(Process::CLOCK_MONOTONIC) - start), 0].max
    elapsed = (Process.clock_gettime(Process::CLOCK_MONOTONIC) - start).round(3)
    added = $LOADED_FEATURES - last_features
    last_features = $LOADED_FEATURES.dup
    probe_log(probe_log, "WATCHDOG elapsed=#{elapsed}s features=#{$LOADED_FEATURES.length} delta=#{added.last(30).join('|')}")
    Thread.list.each do |thread|
      probe_log(probe_log, "THREAD id=#{thread.object_id} status=#{thread.status} stack=#{probe_stack(thread).join(' <- ')}")
    end
    gc = GC.stat
    probe_log(probe_log, "GC count=#{gc[:count]} heap_live_slots=#{gc[:heap_live_slots]} malloc_increase_bytes=#{gc[:malloc_increase_bytes]}")
  end
end

probe_log(probe_log, 'BEFORE_INITIALIZE_CALL')
Rails.application.initialize!
probe_log(probe_log, 'AFTER_INITIALIZE')
probe_log(probe_log, 'BEFORE_ACTIVE_RECORD')
require 'active_record'
probe_log(probe_log, 'AFTER_ACTIVE_RECORD')
probe_log(probe_log, 'BOOT_OK')
watchdog.kill
