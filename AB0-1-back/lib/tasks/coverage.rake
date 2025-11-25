# frozen_string_literal: true

namespace :test do
  desc 'Run tests with coverage report'
  task :coverage do
    ENV['COVERAGE'] = 'true'
    Rake::Task['test'].invoke
  end

  desc 'Run tests with coverage and open HTML report'
  task :coverage_report do
    ENV['COVERAGE'] = 'true'
    Rake::Task['test'].invoke
    
    if File.exist?('coverage/index.html')
      puts "\n📊 Opening coverage report...\n"
      system('open coverage/index.html') || system('xdg-open coverage/index.html')
    else
      puts "\n❌ Coverage report not found\n"
    end
  end

  desc 'Check if coverage meets minimum threshold'
  task :coverage_check do
    require 'simplecov'
    require 'json'

    coverage_file = 'coverage/.last_run.json'
    
    unless File.exist?(coverage_file)
      puts "❌ Coverage file not found. Run 'rake test:coverage' first"
      exit 1
    end

    data = JSON.parse(File.read(coverage_file))
    coverage = data['result']['line']

    puts "\n📊 Current Coverage: #{coverage.round(2)}%"

    threshold = ENV.fetch('MINIMUM_COVERAGE', '80').to_f

    if coverage >= threshold
      puts "✅ Coverage meets threshold (#{threshold}%)"
      exit 0
    else
      puts "❌ Coverage below threshold (#{threshold}%)"
      puts "   Need #{(threshold - coverage).round(2)}% more coverage"
      exit 1
    end
  end
end

# Alias para facilitar uso
task coverage: 'test:coverage'
