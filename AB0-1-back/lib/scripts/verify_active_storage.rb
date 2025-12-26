# Usage: rails runner lib/scripts/verify_active_storage.rb

puts "Iniciando verificação de recursos do Active Storage..."

# Lista de arquivos críticos para verificar
critical_files = [
  "icon-carros-eletricos-e-recargas.png",
  "icon-recarga-em-condomínios.png"
]

# Verificar configuração do serviço
service_name = Rails.application.config.active_storage.service
puts "Serviço de Armazenamento Configurado: #{service_name}"

critical_files.each do |filename|
  puts "\nVerificando: #{filename}"
  
  # 1. Verificar no Banco de Dados
  blobs = ActiveStorage::Blob.where(filename: filename)
  
  if blobs.empty?
    puts "❌ [DB] Arquivo não encontrado na tabela active_storage_blobs."
    next
  else
    puts "✅ [DB] Encontrado(s) #{blobs.count} registro(s) no banco."
  end

  blobs.each do |blob|
    # 2. Verificar integridade do arquivo físico/nuvem
    if blob.service.exist?(blob.key)
      puts "  ✅ [STORAGE] Arquivo existe no serviço de armazenamento (Key: #{blob.key})."
      puts "  ℹ️  URL (com proxy): #{Rails.application.routes.url_helpers.rails_blob_path(blob, only_path: true) rescue 'N/A'}"
    else
      puts "  ❌ [STORAGE] ERRO CRÍTICO: O arquivo está registrado no banco mas NÃO existe no armazenamento (Key: #{blob.key})."
      puts "     Sugestão: Remova o blob inválido ou faça upload manual do arquivo."
    end
    
    # 3. Verificar integridade (Checksum) - Opcional, apenas se o arquivo existir
    # if blob.service.exist?(blob.key)
    #   valid = blob.service.checksum(blob.key) == blob.checksum
    #   puts "     Checksum: #{valid ? 'OK' : 'Inválido'}"
    # end
  end
end

puts "\n--- Verificação de Permissões (Apenas para Disk Service) ---"
if service_name.to_s.include?('disk') || service_name.to_s.include?('local')
  storage_path = Rails.root.join('storage')
  if Dir.exist?(storage_path)
    puts "✅ Diretório 'storage' existe."
    
    # Tentar escrever um arquivo de teste
    begin
      test_file = storage_path.join('.write_test')
      File.write(test_file, 'test')
      File.delete(test_file)
      puts "✅ Permissões de escrita confirmadas no diretório storage."
    rescue => e
      puts "❌ Erro de permissão no diretório storage: #{e.message}"
    end
  else
    puts "❌ Diretório 'storage' não encontrado em #{storage_path}."
  end
else
  puts "Pulo verificação de disco local (Serviço não é local)."
end

puts "\nDiagnóstico concluído."
