# ============================================================================
# EXEMPLO: Como Configurar o Botão WhatsApp
# ============================================================================
#
# Execute este arquivo no Rails Console:
#
#   rails console
#   load 'EXEMPLO_CONFIGURAR_WHATSAPP.rb'
#
# Ou execute os comandos linha por linha no console
# ============================================================================

puts "\n🚀 Configurando botão WhatsApp para empresas...\n\n"

# ============================================================================
# EXEMPLO 1: Configurar uma empresa específica
# ============================================================================
puts '📝 EXEMPLO 1: Configurar empresa específica'
puts '=' * 70

# Substitua o ID pela empresa desejada
empresa_id = 1
empresa = Company.find_by(id: empresa_id)

if empresa
  puts "Empresa encontrada: #{empresa.name}"

  # Configurar WhatsApp (formato internacional com código do país)
  empresa.whatsapp = '+5511999999999' # Substitua pelo número real

  # Ativar plano pago (escolha uma das opções)
  empresa.featured = true # Marca como empresa em destaque
  # empresa.verified = true # OU marca como verificada

  if empresa.save
    puts '✅ Empresa configurada com sucesso!'
    puts "   WhatsApp: #{empresa.whatsapp}"
    puts "   Featured: #{empresa.featured}"
    puts "   Botão ativo: #{(empresa.featured || empresa.verified) && empresa.whatsapp.present? ? 'SIM' : 'NÃO'}"
  else
    puts "❌ Erro: #{empresa.errors.full_messages}"
  end
else
  puts "❌ Empresa com ID #{empresa_id} não encontrada"
end

puts "\n"

# ============================================================================
# EXEMPLO 2: Configurar múltiplas empresas
# ============================================================================
puts '📝 EXEMPLO 2: Configurar múltiplas empresas'
puts '=' * 70

# Lista de empresas para configurar
configuracoes = [
  { id: 1, whatsapp: '+5511999999999', featured: true },
  { id: 2, whatsapp: '+5511888888888', verified: true },
  { id: 3, whatsapp: '+5511777777777', featured: true, verified: true }
]

configuracoes.each do |config|
  empresa = Company.find_by(id: config[:id])
  next unless empresa

  empresa.update(
    whatsapp: config[:whatsapp],
    featured: config[:featured] || false,
    verified: config[:verified] || false
  )

  puts "✅ #{empresa.name} - WhatsApp: #{empresa.whatsapp}"
end

puts "\n"

# ============================================================================
# EXEMPLO 3: Listar empresas com botão WhatsApp ativo
# ============================================================================
puts '📝 EXEMPLO 3: Empresas com botão WhatsApp ativo'
puts '=' * 70

empresas_com_botao = Company.where(
  "(featured = ? OR verified = ?) AND whatsapp IS NOT NULL AND whatsapp != ''",
  true,
  true
)

puts "Total: #{empresas_com_botao.count} empresas com botão ativo\n"

empresas_com_botao.each do |emp|
  puts "  🏢 #{emp.name} - #{emp.whatsapp}"
  puts "     Featured: #{emp.featured} | Verified: #{emp.verified}"
end

puts "\n"

# ============================================================================
# EXEMPLO 4: Estatísticas
# ============================================================================
puts '📊 ESTATÍSTICAS'
puts '=' * 70

total = Company.count
com_whatsapp = Company.where.not(whatsapp: [nil, '']).count
com_featured = Company.where(featured: true).count
com_verified = Company.where(verified: true).count
com_plano_pago = Company.where('featured = ? OR verified = ?', true, true).count
com_botao_ativo = Company.where(
  "(featured = ? OR verified = ?) AND whatsapp IS NOT NULL AND whatsapp != ''",
  true,
  true
).count

puts "Total de empresas: #{total}"
puts "Com WhatsApp cadastrado: #{com_whatsapp}"
puts "Com plano Featured: #{com_featured}"
puts "Com plano Verified: #{com_verified}"
puts "Com plano pago (Featured OU Verified): #{com_plano_pago}"
puts "Com botão WhatsApp ATIVO: #{com_botao_ativo} ✨"

puts "\n#{'=' * 70}"
puts '✅ Configuração concluída!'
puts '🌐 Acesse: http://localhost:3000/companies/[ID]'
puts '=' * 70
