
# Script para verificar integridade dos dados de analytics
# Execute com: bundle exec rails runner verify_analytics.rb

puts "--- Verificando Integridade de Dados de Analytics ---"

company_id = 372
company = Company.find_by(id: company_id)

if company.nil?
  puts "❌ Empresa #{company_id} não encontrada."
  exit
end

puts "✅ Empresa: #{company.name} (ID: #{company.id})"

# 1. Verificar Eventos Brutos
events_count = AnalyticsEvent.where(company_id: company_id).count
recent_events = AnalyticsEvent.where(company_id: company_id).where('tracked_at > ?', 30.days.ago).count
unique_event_types = AnalyticsEvent.where(company_id: company_id).distinct.pluck(:event_type)

puts "\n1. AnalyticsEvent (Eventos Brutos):"
puts "   Total: #{events_count}"
puts "   Últimos 30 dias: #{recent_events}"
puts "   Tipos detectados: #{unique_event_types.join(', ')}"

# 2. Verificar Estatísticas Agregadas
stats = CompanyDailyStat.where(company_id: company_id).order(day: :desc).limit(5)
total_stats = CompanyDailyStat.where(company_id: company_id).count

puts "\n2. CompanyDailyStat (Estatísticas Agregadas):"
puts "   Total de dias agregados: #{total_stats}"
if stats.any?
  stats.each do |s|
    puts "   Dia: #{s.day} | Views: #{s.profile_views} | Clicks: #{s.cta_clicks} | Leads: #{s.leads}"
  end
else
  puts "   ⚠️ Nenhum dado agregado encontrado para esta empresa."
end

# 3. Verificar GA4 Engagement Metrics
puts "\n3. GA4 & Engagement (Cartões de Performance):"
if company.respond_to?(:engagement_metrics)
  puts "   Engagement Metrics: #{company.engagement_metrics || 'Vazio (null)'}"
else
  puts "   ⚠️ Campo 'engagement_metrics' não existe no modelo Company."
end

if company.respond_to?(:ga4_property_id)
  puts "   GA4 Property ID: #{company.ga4_property_id || 'Não configurado'}"
else
  puts "   ⚠️ Campo 'ga4_property_id' não existe no modelo Company."
end

# 4. Diagnóstico
puts "\n4. Diagnóstico Sugerido:"
if recent_events > 0 && total_stats == 0
  puts "   👉 AÇÃO: Rode 'rake analytics:backfill_daily_stats' para processar os eventos brutos."
elsif recent_events == 0
  puts "   👉 AÇÃO: Verifique se o frontend está enviando eventos 'profile_view' ou 'cta_click'."
end

if company.respond_to?(:engagement_metrics) && company.engagement_metrics.nil?
  puts "   👉 AÇÃO: Os cards de 'Tempo de Sessão' e 'Rejeição' dependem do GA4. O job 'import_ga4_metrics' precisa rodar com sucesso."
end
