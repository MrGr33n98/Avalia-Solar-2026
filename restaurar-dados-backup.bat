@echo off
chcp 65001 >nul
echo ========================================
echo 🔄 RESTAURANDO DADOS DO BACKUP
echo ========================================
echo.

cd AB0-1-back

echo.
echo 📊 ETAPA 1: Importando empresas do backup...
echo ========================================
rails runner "
puts '🔄 Carregando dados do backup de empresas...'
require 'json'

# Ler arquivo JSON com empresas
companies_data = JSON.parse(File.read('companies.json'))

puts \"✅ #{companies_data.length} empresas encontradas no backup\"

companies_data.each_with_index do |company_data, index|
  puts \"\\n[#{index + 1}/#{companies_data.length}] Processando: #{company_data['name']}\"
  
  # Buscar ou criar empresa
  company = Company.find_or_initialize_by(id: company_data['id'])
  
  # Atualizar atributos
  company.assign_attributes(
    name: company_data['name'],
    description: company_data['description'],
    website: company_data['website'],
    phone: company_data['phone'],
    address: company_data['address'],
    state: company_data['state'],
    city: company_data['city'],
    rating_avg: company_data['rating_avg'],
    rating_count: company_data['rating_count'],
    status: company_data['status'],
    featured: company_data['featured'],
    verified: company_data['verified'],
    founded_year: company_data['founded_year'],
    employees_count: company_data['employees_count'],
    certifications: company_data['certifications'],
    email_public: company_data['email_public'],
    instagram: company_data['instagram'],
    facebook: company_data['facebook'],
    linkedin: company_data['linkedin'],
    working_hours: company_data['working_hours'],
    payment_methods: company_data['payment_methods']
  )
  
  if company.save
    puts \"✅ Empresa salva: #{company.name}\"
  else
    puts \"❌ Erro ao salvar: #{company.errors.full_messages.join(', ')}\"
  end
end

puts \"\\n🎉 Importação de empresas concluída!\"
puts \"Total de empresas: #{Company.count}\"
"

echo.
echo 🎨 ETAPA 2: Recriando banners...
echo ========================================
ruby create_test_banners.rb

echo.
echo 📋 ETAPA 3: Verificando dados restaurados...
echo ========================================
rails runner "
puts '\\n📊 RESUMO DA RESTAURAÇÃO:'
puts '=' * 60
puts \"✅ Empresas: #{Company.count}\"
puts \"   - Ativas: #{Company.where(status: 'active').count}\"
puts \"   - Em destaque: #{Company.where(featured: true).count}\"
puts \"   - Verificadas: #{Company.where(verified: true).count}\"
puts ''
puts \"✅ Banners: #{Banner.count}\"
puts \"   - Ativos: #{Banner.where(active: true).count}\"
if Banner.column_names.include?('moderation_status')
  puts \"   - Aprovados: #{Banner.where(moderation_status: 'approved').count}\"
end
puts \"   - Categories Top: #{Banner.where(position: 'categories_top', active: true).count}\"
puts '=' * 60
puts ''
puts '✅ DADOS RESTAURADOS COM SUCESSO!'
"

echo.
echo ========================================
echo ✅ RESTAURAÇÃO CONCLUÍDA
echo ========================================
echo.
echo ✓ Empresas restauradas do backup
echo ✓ Banners recriados
echo ✓ Sistema pronto para deploy
echo.
echo Próximos passos:
echo 1. Fazer commit das alterações
echo 2. Fazer push para o repositório
echo 3. Deploy será feito automaticamente via GitHub Actions
echo.
pause
