#!/usr/bin/env ruby

require 'fileutils'
require 'bundler'

def check_dependencies
  puts "\n🔍 Verificando dependências..."
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

def backup_files
  timestamp = Time.now.strftime('%Y%m%d_%H%M%S')
  backup_dir = File.join(Dir.pwd, 'rubocop_backup', timestamp)
  
  puts "\n📦 Criando backup dos arquivos..."
  FileUtils.mkdir_p(backup_dir)
  
  Dir.glob('**/*.rb').each do |file|
    next if file.start_with?('db/', 'config/', 'script/', 'bin/', 'vendor/', 'tmp/')
    
    backup_path = File.join(backup_dir, file)
    FileUtils.mkdir_p(File.dirname(backup_path))
    FileUtils.cp(file, backup_path)
  end
  
  puts "✅ Backup criado em: #{backup_dir}"
end

def run_rubocop_auto_correct
  puts "\n🔍 Iniciando correções automáticas do RuboCop...\n"
  
  check_dependencies
  backup_files
  
  # Executa o RuboCop com a flag -a para correção automática
  system('bundle exec rubocop -a')
  
  if $?.success?
    puts "\n✅ Correções automáticas concluídas com sucesso!\n"
  else
    puts "\n⚠️  Algumas correções foram aplicadas, mas ainda existem problemas que precisam ser corrigidos manualmente.\n"
    puts "Execute 'bundle exec rubocop' para ver os problemas restantes.\n"
  end
end

# Executa o script
run_rubocop_auto_correct