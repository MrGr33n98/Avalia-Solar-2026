
require 'active_record'

# Conecta ao banco de dados
ActiveRecord::Base.establish_connection(adapter: 'sqlite3', database: 'db/development.sqlite3')

class AdminUser < ActiveRecord::Base
end

# Verifica se existe um usuário admin com email 'felipe@admin.com'
admin = AdminUser.find_by(email: 'felipe@admin.com')

if admin
  puts "✅ Usuário admin encontrado: #{admin.email}"
  # Reseta a senha para teste (use uma senha segura!)
  admin.update(password: 'password123', password_confirmation: 'password123')
  puts "Senha resetada para 'password123' para testes."
else
  # Cria um novo usuário admin se não existir
  AdminUser.create!(email: 'felipe@admin.com', password: 'password123', password_confirmation: 'password123')
  puts "✅ Novo usuário admin criado com email 'felipe@admin.com' e senha 'password123'."
end
