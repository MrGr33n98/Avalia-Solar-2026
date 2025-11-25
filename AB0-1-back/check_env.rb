#!/usr/bin/env ruby
# frozen_string_literal: true

# Script para verificar variáveis de ambiente

puts "=" * 80
puts "Verificando Variáveis de Ambiente"
puts "=" * 80
puts

# Load environment
require 'dotenv'
Dotenv.load('.env.development')

puts "REDIS_ENABLED: #{ENV['REDIS_ENABLED']}"
puts "REDIS_URL: #{ENV['REDIS_URL']}"
puts "RAILS_ENV: #{ENV['RAILS_ENV']}"
puts

if ENV.fetch('REDIS_ENABLED', 'true') == 'true'
  puts "⚠️  ATENÇÃO: Redis está HABILITADO"
  puts "   Para desabilitar, mude REDIS_ENABLED=false no .env.development"
else
  puts "✅ Redis está DESABILITADO"
  puts "   Aplicação usará cache em memória"
end

puts
puts "=" * 80
