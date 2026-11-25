# frozen_string_literal: true

Rails.application.config.after_initialize do
  started_at = Process.clock_gettime(Process::CLOCK_MONOTONIC)
  result = Locations::BrLocations.warmup!
  elapsed_ms = ((Process.clock_gettime(Process::CLOCK_MONOTONIC) - started_at) * 1000).round(1)

  Rails.logger.info(
    "[LocationsWarmup] states=#{result[:state_count]} cities=#{result[:city_count]} " \
    "revision=#{result[:revision]} elapsed_ms=#{elapsed_ms}"
  )
end
