# lib/tasks/mobilidade_eletrica.rake
namespace :db do
  namespace :seed do
    desc 'Seed do ecossistema de mobilidade elétrica no Brasil'
    task mobilidade_eletrica: :environment do
      puts "\n🔌⚡ Iniciando seed de Mobilidade Elétrica..."
      puts '=' * 80

      load(Rails.root.join('db', 'seeds_mobilidade_eletrica.rb'))

      puts "\n✅ Seed de Mobilidade Elétrica executado com sucesso!"
    end
  end
end
