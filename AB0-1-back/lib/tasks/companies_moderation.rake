# frozen_string_literal: true

namespace :companies do
  desc 'Suspende e inativa entidades bancárias da listagem de empresas'
  task suspend_banking_entities: :environment do
    banking_slugs = %w[
      reso-comercio-engenharia-e-servicos-ltda
      banco-abc
      eletro-c-e-c
      all-energy
    ]
    banking_ids = [458, 459, 460, 466]

    targets = Company.where(slug: banking_slugs).or(Company.where(id: banking_ids))
    puts "Encontradas #{targets.count} empresas correspondentes para suspensão."

    targets.each do |c|
      puts "  -> Suspendendo: ID=#{c.id} | Slug='#{c.slug}' | Nome='#{c.name}' (Status anterior: #{c.status})"
      c.update_columns(
        status: 'inactive',
        moderation_status: 'suspended',
        featured: false,
        updated_at: Time.current
      )
    end

    puts "Operação concluída com sucesso. Todas as empresas indicadas estão agora 'inactive' e 'suspended'."
  end
end

