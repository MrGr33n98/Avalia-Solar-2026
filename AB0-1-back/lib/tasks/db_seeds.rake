# frozen_string_literal: true

namespace :db do
  namespace :seed do
    # Dinamicamente cria tarefas para cada arquivo db/seeds_*.rb
    Dir.glob(Rails.root.join('db', 'seeds_*.rb')).each do |filename|
      task_name = File.basename(filename, '.rb')
      
      desc "Executa o arquivo de seed específico: db/#{task_name}.rb"
      task task_name.to_sym => :environment do
        puts "🌱 Iniciando seed: #{task_name}..."
        if File.exist?(filename)
          load(filename)
          puts "✅ Seed #{task_name} executado com sucesso!"
        else
          puts "❌ Erro: Arquivo #{filename} não encontrado."
        end
      end
    end
  end
end