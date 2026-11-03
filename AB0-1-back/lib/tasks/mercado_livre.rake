# frozen_string_literal: true

namespace :db do
  namespace :seed do
    desc 'Seed das subcategorias e conteúdos de Mercado Livre de Energia (ACL)'
    task mercado_livre: :environment do
      puts "\n⚡ Iniciando seed de Mercado Livre de Energia..."
      puts '=' * 80

      load(Rails.root.join('db', 'seeds', 'mercado_livre_categories.rb'))

      puts "\n✅ Seed de Mercado Livre de Energia executado com sucesso!"
    end
  end
end

