# frozen_string_literal: true

# Script para criar usuário da empresa BSol
# Execute: bundle exec rails runner create_company_user.rb

require_relative 'config/environment'

puts "=" * 80
puts "Criando usuário para BSol (Company ID 5)"
puts "=" * 80
puts

# Encontrar a empresa BSol
company = Company.find_by(id: 5)

if company.nil?
  puts "❌ ERRO: Company ID 5 não encontrada!"
  puts "Verifique se a empresa existe:"
  Company.limit(10).each do |c|
    puts "  ID: #{c.id} - #{c.name}"
  end
  exit 1
end

puts "✅ Empresa encontrada: #{company.name}"
puts

# Email e senha para o usuário da BSol
email = "admin@bsol.com"
password = "bsol123456"

# Verificar se usuário já existe
existing_user = User.find_by(email: email)

if existing_user
  puts "ℹ️  Usuário já existe: #{email}"
  
  # Atualizar company_id se necessário
  if existing_user.company_id != company.id
    existing_user.update(company_id: company.id)
    puts "✅ Usuário associado à company: #{company.name}"
  else
    puts "✅ Usuário já está associado à company: #{company.name}"
  end
  
  user = existing_user
else
  # Criar novo usuário
  user = User.new(
    email: email,
    password: password,
    password_confirmation: password,
    company_id: company.id
  )
  
  if user.save
    puts "✅ Usuário criado com sucesso!"
  else
    puts "❌ Erro ao criar usuário:"
    user.errors.full_messages.each do |msg|
      puts "  - #{msg}"
    end
    exit 1
  end
end

puts
puts "=" * 80
puts "CREDENCIAIS DE ACESSO"
puts "=" * 80
puts
puts "📧 Email:    #{email}"
puts "🔑 Senha:    #{password}"
puts "🏢 Empresa:  #{company.name} (ID: #{company.id})"
puts
puts "=" * 80
puts "COMO USAR"
puts "=" * 80
puts
puts "1. Frontend - Fazer login:"
puts "   🌐 http://localhost:3000/login"
puts "   📧 Email: #{email}"
puts "   🔑 Senha: #{password}"
puts
puts "2. Acessar dashboard da empresa:"
puts "   🌐 http://localhost:3000/dashboard/company"
puts "   (Após fazer login)"
puts
puts "3. Ver página pública da empresa:"
puts "   🌐 http://localhost:3000/companies/5"
puts
puts "4. Admin (Rails) - se tiver AdminUser:"
puts "   🌐 http://localhost:3001/admin"
puts
puts "=" * 80
puts "VERIFICAÇÃO"
puts "=" * 80
puts

# Verificar associação
puts "User ID: #{user.id}"
puts "User Email: #{user.email}"
puts "Company ID: #{user.company_id}"
puts "Company Name: #{user.company&.name}"
puts

if user.company_id == company.id
  puts "✅ Associação verificada com sucesso!"
else
  puts "❌ Erro: Usuário não está associado à empresa!"
end

puts
puts "=" * 80
puts "🎉 PRONTO! Agora você pode fazer login com as credenciais acima."
puts "=" * 80
