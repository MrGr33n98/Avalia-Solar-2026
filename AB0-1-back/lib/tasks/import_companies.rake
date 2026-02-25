require 'open-uri'

namespace :import do
  desc 'IMPORTAÇÃO COMPLETA V2 (Categorias + Social + Logos)'
  task full_import_v2: :environment do
    json_path = Rails.root.join('lib', 'data', 'companies_v2.json')

    unless File.exist?(json_path)
      puts '❌ Arquivo não encontrado! Certifique-se de que copiou o JSON para: lib/data/companies_v2.json'
      next
    end

    puts '🗑️  Limpando banco para importação limpa...'
    Company.destroy_all
    begin
      ActiveRecord::Base.connection.reset_pk_sequence!('companies')
    rescue StandardError
      nil
    end

    data_list = JSON.parse(File.read(json_path))
    puts "🚀 Iniciando importação de #{data_list.count} empresas enriquecidas..."

    data_list.each do |data|
      # Criação da empresa com todos os novos campos
      company = Company.create!(
        name: data['name'].strip,
        cnpj: data['cnpj'],
        city: data['city'],
        state: data['state'],
        description: data['description'],
        website: data['website'],
        phone: data['phone']&.gsub(/\D/, ''),
        address: data['address'],
        latitude: data['latitude'],
        longitude: data['longitude'],
        rating_avg: data['rating_avg'],
        rating_count: data['rating_count'],
        instagram: data['instagram'],
        linkedin: data['linkedin'],
        facebook: data['facebook'],
        status: 'active',
        verified: true
      )

      # 1. Vincular Categorias automaticamente
      if data['categories'].present?
        data['categories'].each do |cat_data|
          category = Category.find_by('LOWER(name) = ?', cat_data['name'].downcase)
          company.categories << category if category && !company.categories.include?(category)
        end

      end

      # 2. Anexar Logo (Prioriza o oficial, senão usa o do logo.dev)
      logo_url = data['logo_official_url'] || data['logo_url']
      if logo_url.present?
        begin
          file = URI.open(logo_url, open_timeout: 15)
          company.logo.attach(
            io: file,
            filename: "logo_#{company.id}.png",
            content_type: 'image/png'
          )
          print '✅ '
        rescue StandardError
          print '⚠️ (Erro Logo) '
        end
      end

      puts "#{company.name} [Categorias: #{company.categories.count}]"
    rescue StandardError => e
      puts "❌ Erro em '#{data['name']}': #{e.message}"
    end
    puts '🏁 Importação V2 finalizada!'
  end

  desc 'Sincronização mestre de logos e nomes com relatório final'
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
      company = Company.where('LOWER(TRIM(name)) = ?', clean_name.downcase).first

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
            puts '✅'
            success_count += 1
          rescue StandardError => e
            puts "❌ (Erro: #{e.message})"
            error_count += 1
          end
        else
          puts '⚠️ (Sem URL de logo)'
          success_count += 1
        end
      else
        puts "❓ Não encontrada: '#{clean_name}'"
        not_found_count += 1
      end
    end

    puts "\n#{'=' * 40}"
    puts '📊 RELATÓRIO FINAL:'
    puts "✅ Sincronizados: #{success_count}"
    puts "❌ Erros de Upload: #{error_count}"
    puts "❓ Não encontradas: #{not_found_count}"
    puts '=' * 40
  end
end
