require 'open-uri'

namespace :import do
  desc "Sincronização mestre de logos e nomes com relatório final"
  task fix_logos: :environment do
    json_path = Rails.root.join('lib', 'data', 'companies_enriched_final.json')
    
    unless File.exist?(json_path)
      puts "❌ Arquivo não encontrado em: #{json_path}"
      next
    end

    data_list = JSON.parse(File.read(json_path))
    puts "🚀 Iniciando sincronização de #{data_list.count} empresas..."
    
    success_count = 0
    error_count = 0
    not_found_count = 0

    data_list.each do |data|
      clean_name = data['name'].strip
      
      # Busca flexível: ignora espaços no início/fim e maiúsculas/minúsculas
      company = Company.where("LOWER(TRIM(name)) = ?", clean_name.downcase).first
      
      # Se não achou pelo nome, tenta pelo ID do JSON
      company ||= Company.find_by(id: data['id'])

      if company
        print "📦 #{company.name} -> #{clean_name} "
        
        # Sincroniza o nome
        company.update_column(:name, clean_name)
        
        if data['logo_url'].present?
          begin
            company.logo.purge if company.logo.attached?
            
            file = URI.open(data['logo_url'], open_timeout: 15)
            company.logo.attach(
              io: file,
              filename: "logo_#{company.id}.png",
              content_type: 'image/png'
            )
            puts "✅"
            success_count += 1
          rescue => e
            puts "❌ (Erro: #{e.message})"
            error_count += 1
          end
        else
          puts "⚠️ (Sem URL de logo)"
          success_count += 1
        end
      else
        puts "❓ Não encontrada: '#{clean_name}'"
        not_found_count += 1
      end
    end

    puts "\n" + "="*40
    puts "📊 RELATÓRIO FINAL:"
    puts "✅ Sincronizados: #{success_count}"
    puts "❌ Erros de Upload: #{error_count}"
    puts "❓ Não encontradas: #{not_found_count}"
    puts "="*40
  end
end