# frozen_string_literal: true

namespace :security do
  desc 'Run Brakeman security scanner'
  task :brakeman do
    require 'brakeman'
    
    puts "\n🔍 Running Brakeman security scan...\n"
    
    tracker = Brakeman.run(
      app_path: '.',
      print_report: true,
      config_file: 'config/brakeman.yml'
    )
    
    # Contar warnings por severidade
    high = tracker.warnings.select { |w| w.confidence == 0 }.count
    medium = tracker.warnings.select { |w| w.confidence == 1 }.count
    low = tracker.warnings.select { |w| w.confidence == 2 }.count
    
    puts "\n" + "="*50
    puts "📊 Brakeman Results:"
    puts "="*50
    puts "High Confidence:   #{high} warning(s)"
    puts "Medium Confidence: #{medium} warning(s)"
    puts "Low Confidence:    #{low} warning(s)"
    puts "Total:             #{tracker.warnings.count} warning(s)"
    puts "="*50
    
    if tracker.warnings.any?
      puts "\n⚠️  Warnings found! Check tmp/brakeman-report.html for details"
      exit 1 unless ENV['BRAKEMAN_ALLOW_WARNINGS']
    else
      puts "\n✅ No security warnings found!"
      exit 0
    end
  end

  desc 'Run Bundler Audit to check for vulnerable dependencies'
  task :bundler_audit do
    puts "\n🔍 Running Bundler Audit...\n"
    
    # Update database
    puts "Updating vulnerability database..."
    system('bundle exec bundler-audit update') || true
    
    # Run audit
    puts "\nChecking for vulnerable gems..."
    result = system('bundle exec bundler-audit check')
    
    if result
      puts "\n✅ No vulnerable dependencies found!"
      exit 0
    else
      puts "\n❌ Vulnerable dependencies found!"
      puts "Run 'bundle update' to fix or check advisories at https://github.com/rubysec/ruby-advisory-db"
      exit 1 unless ENV['BUNDLER_AUDIT_ALLOW_WARNINGS']
    end
  end

  desc 'Run all security checks'
  task all: [:brakeman, :bundler_audit] do
    puts "\n" + "="*50
    puts "✅ All security checks passed!"
    puts "="*50
  end

  desc 'Security check for CI (strict mode)'
  task :ci do
    ENV['BRAKEMAN_ALLOW_WARNINGS'] = 'false'
    ENV['BUNDLER_AUDIT_ALLOW_WARNINGS'] = 'false'
    Rake::Task['security:all'].invoke
  end
end

# Alias para facilitar
task security: 'security:all'
