# frozen_string_literal: true

namespace :db do
  namespace :migrate do
    desc "Test migration reversibility"
    task test_reversibility: :environment do
      puts "🧪 Testing Migration Reversibility"
      puts "=" * 60
      
      steps = ENV.fetch('STEPS', 5).to_i
      
      # Get current version
      current_version = ActiveRecord::Migrator.current_version
      puts "Current version: #{current_version}"
      
      # Backup
      puts "\n📦 Creating backup..."
      schema_before = File.read('db/schema.rb')
      
      # Rollback
      puts "\n⏪ Rolling back #{steps} step(s)..."
      Rake::Task['db:rollback'].invoke
      ENV['STEP'] = steps.to_s
      
      after_rollback = ActiveRecord::Migrator.current_version
      puts "Version after rollback: #{after_rollback}"
      
      # Re-migrate
      puts "\n⏩ Re-applying migrations..."
      Rake::Task['db:migrate'].reenable
      Rake::Task['db:migrate'].invoke
      
      after_migrate = ActiveRecord::Migrator.current_version
      puts "Version after re-migrate: #{after_migrate}"
      
      # Compare
      puts "\n🔍 Comparing schemas..."
      schema_after = File.read('db/schema.rb')
      
      if schema_before == schema_after
        puts "✅ SUCCESS: Schema is identical!"
        puts "   Migrations are properly reversible"
      else
        puts "⚠️  WARNING: Schema differs"
        puts "   This might be expected for data migrations"
        puts "   Run: git diff db/schema.rb"
      end
      
      if current_version == after_migrate
        puts "\n✅ Version restored correctly"
      else
        puts "\n❌ ERROR: Version mismatch!"
        puts "   Expected: #{current_version}"
        puts "   Got: #{after_migrate}"
      end
    end
    
    desc "Audit all migrations for reversibility"
    task audit: :environment do
      puts "📋 Migration Reversibility Audit"
      puts "=" * 60
      
      migration_files = Dir.glob(Rails.root.join('db/migrate/*.rb')).sort
      
      stats = {
        total: 0,
        with_change: 0,
        with_up_down: 0,
        problematic: []
      }
      
      migration_files.each do |file|
        stats[:total] += 1
        content = File.read(file)
        filename = File.basename(file)
        
        has_change = content.match?(/^\s*def change/)
        has_up = content.match?(/^\s*def up/)
        has_down = content.match?(/^\s*def down/)
        
        if has_change
          stats[:with_change] += 1
          
          # Check for problematic patterns in change method
          problematic_patterns = [
            { pattern: /change_column(?!_null|_default)/, name: 'change_column' },
            { pattern: /execute/, name: 'execute' },
            { pattern: /remove_column/, name: 'remove_column without type' }
          ]
          
          problematic_patterns.each do |check|
            if content.match?(check[:pattern])
              stats[:problematic] << {
                file: filename,
                issue: "Uses #{check[:name]} in 'def change'"
              }
            end
          end
        elsif has_up && has_down
          stats[:with_up_down] += 1
        else
          stats[:problematic] << {
            file: filename,
            issue: "No change, up, or down method found"
          }
        end
      end
      
      puts "\n📊 Statistics:"
      puts "-" * 60
      puts "Total migrations:              #{stats[:total]}"
      puts "Using 'def change':            #{stats[:with_change]} (#{(stats[:with_change] * 100.0 / stats[:total]).round}%)"
      puts "Using 'def up/down':           #{stats[:with_up_down]} (#{(stats[:with_up_down] * 100.0 / stats[:total]).round}%)"
      puts "Potentially problematic:       #{stats[:problematic].size}"
      
      if stats[:problematic].any?
        puts "\n⚠️  Problematic Migrations:"
        puts "-" * 60
        stats[:problematic].each do |item|
          puts "#{item[:file]}"
          puts "  → #{item[:issue]}"
        end
        
        puts "\n💡 Recommendations:"
        puts "  1. Review these migrations manually"
        puts "  2. Convert 'def change' to 'def up/down' for irreversible operations"
        puts "  3. Test rollback: rails db:rollback"
        puts "  4. See docs/MIGRATION_BEST_PRACTICES.md for guidance"
      else
        puts "\n✅ All migrations follow best practices!"
      end
      
      puts "\n📚 Resources:"
      puts "  • Best practices: docs/MIGRATION_BEST_PRACTICES.md"
      puts "  • Full audit: docs/MIGRATIONS_AUDIT.md"
      puts "  • Test reversibility: bin/test_migrations"
    end
    
    desc "List migrations with def down"
    task list_reversible: :environment do
      puts "📋 Migrations with explicit 'def down'"
      puts "=" * 60
      
      migration_files = Dir.glob(Rails.root.join('db/migrate/*.rb')).sort
      count = 0
      
      migration_files.each do |file|
        content = File.read(file)
        if content.match?(/^\s*def down/)
          count += 1
          filename = File.basename(file)
          puts "✓ #{filename}"
          
          # Show the down method
          down_method = content.scan(/def down.*?^  end/m).first
          if down_method && down_method.lines.count < 10
            puts down_method.lines.map { |l| "    #{l}" }.join
          end
          puts
        end
      end
      
      puts "Total: #{count} migrations with explicit down method"
    end
    
    desc "Check for unsafe migration patterns"
    task check_unsafe: :environment do
      puts "🔍 Checking for Unsafe Migration Patterns"
      puts "=" * 60
      
      migration_files = Dir.glob(Rails.root.join('db/migrate/*.rb')).sort
      
      unsafe_patterns = [
        {
          name: 'Adding column with default on large table',
          pattern: /add_column.*,\s*default:/,
          severity: :warning,
          advice: 'Consider adding column first, then backfilling, then setting default'
        },
        {
          name: 'change_column in def change',
          pattern: /def change.*?change_column(?!_null|_default)/m,
          severity: :error,
          advice: 'Use def up/down explicitly'
        },
        {
          name: 'remove_column without type specification',
          pattern: /remove_column\s+:\w+,\s*:\w+\s*$/,
          severity: :warning,
          advice: 'Specify column type for reversibility: remove_column :table, :column, :type'
        },
        {
          name: 'Using model classes in migration',
          pattern: /(?:User|Product|Company|Post|Review)\.(find|where|update|create|destroy)/,
          severity: :warning,
          advice: 'Define model inline or use SQL directly'
        },
        {
          name: 'add_index without algorithm: :concurrently',
          pattern: /add_index.*(?!algorithm.*:concurrently)/,
          severity: :info,
          advice: 'For large tables, use algorithm: :concurrently with disable_ddl_transaction!'
        }
      ]
      
      issues_found = []
      
      migration_files.each do |file|
        content = File.read(file)
        filename = File.basename(file)
        
        unsafe_patterns.each do |check|
          if content.match?(check[:pattern])
            issues_found << {
              file: filename,
              issue: check[:name],
              severity: check[:severity],
              advice: check[:advice]
            }
          end
        end
      end
      
      if issues_found.any?
        # Group by severity
        errors = issues_found.select { |i| i[:severity] == :error }
        warnings = issues_found.select { |i| i[:severity] == :warning }
        infos = issues_found.select { |i| i[:severity] == :info }
        
        if errors.any?
          puts "\n🔴 ERRORS (#{errors.size}):"
          puts "-" * 60
          errors.each do |issue|
            puts "#{issue[:file]}"
            puts "  ❌ #{issue[:issue]}"
            puts "  💡 #{issue[:advice]}"
            puts
          end
        end
        
        if warnings.any?
          puts "\n⚠️  WARNINGS (#{warnings.size}):"
          puts "-" * 60
          warnings.each do |issue|
            puts "#{issue[:file]}"
            puts "  ⚠️  #{issue[:issue]}"
            puts "  💡 #{issue[:advice]}"
            puts
          end
        end
        
        if infos.any?
          puts "\n💡 INFO (#{infos.size}):"
          puts "-" * 60
          infos.each do |issue|
            puts "#{issue[:file]}"
            puts "  ℹ️  #{issue[:issue]}"
            puts "  💡 #{issue[:advice]}"
            puts
          end
        end
        
        puts "\n📊 Summary:"
        puts "  Errors:   #{errors.size}"
        puts "  Warnings: #{warnings.size}"
        puts "  Info:     #{infos.size}"
      else
        puts "\n✅ No unsafe patterns detected!"
      end
      
      puts "\n📚 Learn more:"
      puts "  • docs/MIGRATION_BEST_PRACTICES.md"
      puts "  • https://github.com/ankane/strong_migrations"
    end
  end
end
