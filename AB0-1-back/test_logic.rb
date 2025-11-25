# Testar lógica dos controllers diretamente
require_relative 'config/environment'

puts "Testing Leads logic..."

# Testar lógica de leads diretamente
begin
  # Simular a lógica do controller
  status = 'pending'
  
  # Tentar buscar leads com base no status
  if status.present?
    leads = Lead.where(status: status)
  else
    leads = Lead.all
  end
  
  puts "✅ Leads query result: #{leads.count} leads found"
  puts "Sample lead: #{leads.first.inspect}" if leads.any?
  
rescue => e
  puts "❌ Leads logic error: #{e.message}"
  puts e.backtrace[0..3]
end

puts "\nTesting Companies analytics logic..."

# Testar lógica de analytics
begin
  company_id = 5
  
  # Verificar se company existe
  company = Company.find_by(id: company_id)
  
  if company
    puts "✅ Company found: #{company.name}"
    
    # Gerar dados de analytics (fallback)
    analytics_data = {
      traffic: {
        daily: (1..30).map { |i| { date: i.days.ago.to_date.to_s, visits: rand(50..500) } }.reverse,
        weekly: (1..12).map { |i| { week: "Week #{i}", visits: rand(200..2000) } },
        monthly: (1..6).map { |i| { month: i.months.ago.strftime("%B %Y"), visits: rand(1000..10000) } }.reverse
      },
      sources: [
        { source: "Organic Search", visits: 4500, percentage: 45 },
        { source: "Direct", visits: 2500, percentage: 25 },
        { source: "Social Media", visits: 2000, percentage: 20 },
        { source: "Referral", visits: 1000, percentage: 10 }
      ]
    }
    
    puts "✅ Analytics data generated successfully"
  else
    puts "⚠️ Company not found, would return empty data"
  end
  
rescue => e
  puts "❌ Analytics logic error: #{e.message}"
  puts e.backtrace[0..3]
end