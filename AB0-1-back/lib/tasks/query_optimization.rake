# frozen_string_literal: true

# Query optimization rake tasks - TASK-022
namespace :queries do
  desc 'Analyze and suggest missing indexes'
  task analyze_indexes: :environment do
    require 'query_optimization/indexes'
    
    puts "\n🔍 Analyzing database indexes..."
    suggestions = QueryOptimization::Indexes.analyze
    
    if suggestions.empty?
      puts "✅ All recommended indexes are present!"
    else
      puts "\n⚠️  Found #{suggestions.size} missing indexes:\n\n"
      suggestions.each do |suggestion|
        puts "Table: #{suggestion[:table]}"
        puts "Column: #{suggestion[:column]}"
        puts "Type: #{suggestion[:type]}"
        puts "Migration: #{suggestion[:migration]}"
        puts "-" * 50
      end
      
      puts "\n📝 Generate migration with:"
      puts "rails g migration AddMissingIndexes"
      puts "\nThen add these lines to the migration:"
      suggestions.each { |s| puts "  #{s[:migration]}" }
    end
  end

  desc 'Reset all counter caches'
  task reset_counters: :environment do
    puts "\n🔄 Resetting counter caches..."
    
    # Add your models with counter caches here
    models_with_counters = [
      # { model: Company, association: :reviews },
      # { model: User, association: :reviews },
    ]
    
    models_with_counters.each do |config|
      model = config[:model]
      association = config[:association]
      
      puts "  Resetting #{model.name}.#{association}_count..."
      model.find_each do |record|
        model.reset_counters(record.id, association)
      end
    end
    
    puts "✅ Counter caches reset complete!"
  end

  desc 'Show slow queries from logs'
  task slow_queries: :environment do
    log_file = Rails.root.join('log', "#{Rails.env}.log")
    
    unless File.exist?(log_file)
      puts "❌ Log file not found: #{log_file}"
      exit 1
    end
    
    puts "\n🐌 Scanning for slow queries (>100ms)...\n\n"
    
    File.readlines(log_file).grep(/SLOW QUERY/).each do |line|
      puts line
    end
  end

  desc 'Benchmark common queries'
  task benchmark: :environment do
    require 'benchmark'
    
    puts "\n⏱️  Benchmarking common queries...\n\n"
    
    Benchmark.bm(30) do |x|
      x.report("Company.all (no includes):") do
        Company.limit(100).each { |c| c.reviews.count }
      end
      
      x.report("Company.includes(:reviews):") do
        Company.includes(:reviews).limit(100).each { |c| c.reviews.size }
      end
      
      x.report("Review.all.map(&:user):") do
        Review.limit(100).map(&:user)
      end
      
      x.report("Review.includes(:user):") do
        Review.includes(:user).limit(100).map(&:user)
      end
      
      x.report("Company.count:") do
        Company.count
      end
      
      x.report("Company.cached_count:") do
        Company.cached_count
      end
    end
  end

  desc 'Show database statistics'
  task stats: :environment do
    puts "\n📊 Database Statistics\n\n"
    
    ActiveRecord::Base.connection.tables.sort.each do |table|
      next if table == 'schema_migrations' || table == 'ar_internal_metadata'
      
      count = ActiveRecord::Base.connection.select_value("SELECT COUNT(*) FROM #{table}")
      indexes = ActiveRecord::Base.connection.indexes(table).size
      
      puts sprintf("%-30s %10s rows, %2d indexes", table, count, indexes)
    end
  end
end
