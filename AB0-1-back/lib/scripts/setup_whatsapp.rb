#!/usr/bin/env ruby
# Script para configurar o botão WhatsApp para empresas
# Uso: rails runner lib/scripts/setup_whatsapp.rb

# NOTE: Este arquivo é carregado pelo Zeitwerk (config.eager_load_paths inclui /lib).
# Para evitar crash em production, ele precisa definir a constante esperada.
module Scripts
  class SetupWhatsapp
  end
end

# CORREÇÃO: Impede a execução automática durante o boot do Rails
if __FILE__ == $PROGRAM_NAME || defined?(Rails::Console)

  puts '🔧 Configurando botão WhatsApp para empresas...'
  puts '=' * 60

  # Perguntar qual empresa configurar
  print "\nDigite o ID da empresa (ou 'all' para todas): "
  # ... resto do seu código original continua igual abaixo ...
end
