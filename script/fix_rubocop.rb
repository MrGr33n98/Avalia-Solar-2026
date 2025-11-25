#!/usr/bin/env ruby

require 'fileutils'
require 'bundler'

def find_rails_root
  current_dir = Dir.pwd
  while current_dir != '/'
    if File.exist?(File.join(current_dir, 'Gemfile')) && 
       File.exist?(File.join(current_dir, 'config', 'application.rb'))
      return current_dir
    end
    current_dir = File.dirname(current_dir)
  end
  nil
end

def check_dependencies
  puts "\n🔍 Verificando dependências..."
  rails_root = find_rails_root
  
  unless rails_root
    puts "❌ Este script deve ser executado a partir de um projeto Rails."
    exit 1
  end
  
  Dir.chdir(rails_root) do
    begin
      require 'rubocop'
      puts "✅ RuboCop está instalado."
    rescue LoadError
      puts "❌ RuboCop não está instalado. Instalando..."
      system('bundle install')
      unless $?.success?
        puts "❌ Falha ao instalar dependências. Por favor, execute 'bundle install' manualmente."
        exit 1
      end
    end
  end
end

def backup_files(rails_root)
  timestamp = Time.now.strftime('%Y%m%d_%H%M%S')
  backup_dir = File.join(rails_root, 'rubocop_backup', timestamp)
  
  puts "\n📦 Criando backup dos arquivos..."
  FileUtils.mkdir_p(backup_dir)
  
  Dir.chdir(rails_root) do
    Dir.glob('**/*.rb').each do |file|
      next if file.start_with?('db/', 'config/', 'script/', 'bin/', 'vendor/', 'tmp/')
      
      backup_path = File.join(backup_dir, file)
      FileUtils.mkdir_p(File.dirname(backup_path))
      FileUtils.cp(file, backup_path)
    end
  end
  
  puts "✅ Backup criado em: #{backup_dir}"
end

def run_rubocop_auto_correct
  puts "\n🔍 Iniciando correções automáticas do RuboCop...\n"
  
  rails_root = find_rails_root
  unless rails_root
    puts "❌ Este script deve ser executado a partir de um projeto Rails."
    exit 1
  end
  
  Dir.chdir(rails_root) do
    check_dependencies
    backup_files(rails_root)
    
    timestamp = Time.now.strftime('%Y%m%d_%H%M%S')
    report_file = File.join('script', "lint_fixes_report_#{timestamp}.txt")
    
    # Executa o RuboCop com a flag -A para correção automática agressiva
    puts "\n🔧 Aplicando correções automáticas..."
    before_fixes = `bundle exec rubocop --format json`
    output = `bundle exec rubocop -A 2>&1`
    after_fixes = `bundle exec rubocop --format json`
    
    # Prepara o relatório com informações detalhadas
    report = "Relatório de Correções do RuboCop\n"
    report << "Data: #{Time.now}\n\n"
    report << "Saída do RuboCop:\n#{output}\n\n"
    
    # Cria o diretório script se não existir e adiciona o output ao arquivo de relatório
    FileUtils.mkdir_p('script')
    File.write(report_file, report)
    
    if $?.success?
      puts "\n✅ Correções automáticas concluídas com sucesso!\n"
      puts "📊 Estatísticas:\n"
      puts "📝 Relatório detalhado salvo em: #{report_file}\n"
    else
      puts "\n⚠️  Correções automáticas aplicadas, mas alguns problemas podem precisar de correção manual.\n"
      puts "📝 Relatório completo salvo em: #{report_file}\n"
      puts "💡 Dica: Execute 'bundle exec rubocop' para verificar o estado atual.\n"
    end
  end
end

# Executa o script
run_rubocop_auto_correct