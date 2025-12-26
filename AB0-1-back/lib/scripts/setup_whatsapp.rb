#!/usr/bin/env ruby
# Script para configurar o botão WhatsApp para empresas
# Uso: rails runner lib/scripts/setup_whatsapp.rb

# CORREÇÃO: Impede a execução automática durante o boot do Rails
return unless __FILE__ == $0 || defined?(Rails::Console)

puts "🔧 Configurando botão WhatsApp para empresas..."
puts "=" * 60

# Perguntar qual empresa configurar
print "\nDigite o ID da empresa (ou 'all' para todas): "
# ... resto do seu código original continua igual abaixo ...