#!/usr/bin/env ruby
# Script para configurar o botão WhatsApp para empresas
# Uso: rails runner lib/scripts/setup_whatsapp.rb

puts "🔧 Configurando botão WhatsApp para empresas..."
puts "=" * 60

# Perguntar qual empresa configurar
print "\nDigite o ID da empresa (ou 'all' para todas): "
company_input = gets.chomp

if company_input.downcase == 'all'
  companies = Company.all
  puts "\n📋 Configurando TODAS as #{companies.count} empresas..."
else
  company_id = company_input.to_i
  companies = Company.where(id: company_id)
  
  if companies.empty?
    puts "\n❌ Empresa com ID #{company_id} não encontrada!"
    exit
  end
end

companies.each do |company|
  puts "\n" + "─" * 60
  puts "🏢 Empresa: #{company.name} (ID: #{company.id})"
  puts "   WhatsApp atual: #{company.whatsapp || '(não configurado)'}"
  puts "   Featured: #{company.featured}"
  puts "   Verified: #{company.verified}"
  
  # Perguntar se deseja configurar esta empresa
  print "\n   Configurar esta empresa? (s/n): "
  resposta = gets.chomp.downcase
  
  next unless resposta == 's' || resposta == 'sim' || resposta == 'y' || resposta == 'yes'
  
  # Configurar WhatsApp
  print "   Digite o número do WhatsApp (+55...): "
  whatsapp = gets.chomp
  
  # Configurar plano
  puts "\n   Tipo de plano:"
  puts "   1) Featured (Destaque)"
  puts "   2) Verified (Verificada)"
  puts "   3) Ambos (Featured + Verified)"
  print "   Escolha (1-3): "
  plano = gets.chomp
  
  # Atualizar empresa
  updates = {}
  updates[:whatsapp] = whatsapp unless whatsapp.empty?
  
  case plano
  when '1'
    updates[:featured] = true
  when '2'
    updates[:verified] = true
  when '3'
    updates[:featured] = true
    updates[:verified] = true
  end
  
  if company.update(updates)
    puts "\n   ✅ Empresa atualizada com sucesso!"
    puts "   📱 WhatsApp: #{company.whatsapp}"
    puts "   ⭐ Featured: #{company.featured}"
    puts "   ✓ Verified: #{company.verified}"
    
    # Verificar se o botão aparecerá
    if (company.featured || company.verified) && company.whatsapp.present?
      puts "   🎉 Botão WhatsApp ATIVO - Aparecerá na página da empresa!"
    else
      puts "   ⚠️  Botão WhatsApp INATIVO - Verifique os requisitos"
    end
  else
    puts "\n   ❌ Erro ao atualizar: #{company.errors.full_messages.join(', ')}"
  end
end

puts "\n" + "=" * 60
puts "✨ Configuração concluída!"
puts "\n📝 Resumo:"

# Mostrar estatísticas
total = Company.count
com_whatsapp = Company.where.not(whatsapp: nil).count
com_plano = Company.where("featured = ? OR verified = ?", true, true).count
com_botao_ativo = Company.where("(featured = ? OR verified = ?) AND whatsapp IS NOT NULL AND whatsapp != ''", true, true).count

puts "   Total de empresas: #{total}"
puts "   Com WhatsApp: #{com_whatsapp}"
puts "   Com plano pago: #{com_plano}"
puts "   Com botão ativo: #{com_botao_ativo}"

puts "\n🚀 Acesse http://localhost:3000/companies/[ID] para ver o botão!"
puts "=" * 60
