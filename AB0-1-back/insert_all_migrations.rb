# Inserir todas as migrações pendentes manualmente
require_relative 'config/environment'

pending_migrations = [
  '20251002033756',
  '20251002035224',
  '20251002040224',
  '20251002041127',
  '20251002041536',
  '20251002110615',
  '20251002113234',
  '20251002163228',
  '20251002200120',
  '20251002200152',
  '20251112121000',
  '20251112235900',
  '20251113120000',
  '20251113122500',
  '20251113124500',
  '20251113124600',
  '20251113124700',
  '20251113131000'
]

puts "Inserting pending migrations..."

pending_migrations.each do |version|
  begin
    ActiveRecord::Base.connection.execute("INSERT INTO schema_migrations (version) VALUES ('#{version}')")
    puts "✅ Migration #{version} inserted"
  rescue => e
    puts "⚠️ Migration #{version} already exists or error: #{e.message}"
  end
end

puts "\n✅ All pending migrations inserted!"