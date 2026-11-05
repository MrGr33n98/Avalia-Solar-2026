# frozen_string_literal: true

# Registra apenas as definições oficiais. Não concede badge a nenhuma empresa.
# A concessão continua exclusiva do ActiveAdmin (badges + company_badges).
namespace :badges do
  desc 'Seed idempotente do catálogo Avalia Solar 2026, sem atribuições automáticas'
  task seed_launch_2026: :environment do
    definitions = [
      ['pioneira-2026', 'Pioneira 2026', 'Participação no lote inaugural de empresas de SC com perfil reivindicado e validação concluída.', 'Lançamento'],
      ['lider-de-categoria', 'Líder de Categoria', 'Classificação superior em categoria definida, com metodologia e amostra mínima de avaliações legítimas.', 'Desempenho'],
      ['lider-de-crescimento', 'Líder de Crescimento', 'Evolução de reputação e engajamento entre períodos comparáveis, com critérios auditáveis.', 'Desempenho'],
      ['referencia-regional', 'Referência Regional', 'Destaque no recorte regional auditado, com comparações justas e reputação verificada.', 'Desempenho'],
      ['melhor-suporte', 'Melhor Suporte', 'Reconhecimento por avaliações qualificadas da experiência de atendimento e pós-venda.', 'Atendimento'],
      ['especialista-comercial', 'Especialista Comercial', 'Atuação em soluções comerciais comprovada por portfólio e categorias validadas.', 'Comercial'],
      ['especialista-residencial', 'Especialista Residencial', 'Atuação em soluções residenciais comprovada por portfólio e categorias validadas.', 'Residencial']
    ]

    definitions.each_with_index do |(slug, name, description, category), idx|
      badge = Badge.find_or_initialize_by(public_slug: slug)
      if badge.new_record?
        badge.assign_attributes(
          name: name,
          description: description,
          category_label: category,
          year: 2026,
          edition: 1,
          position: idx + 1,
          active: true
        )
        badge.save!
        Rails.logger.info("[Badges 2026] Catalog badge created: #{badge.id} (#{slug})")
      else
        puts "Preservado (já existe): #{slug} — nenhuma atribuição alterada"
      end
    end

    puts "Catálogo Avalia Solar 2026 preparado: #{definitions.size} definições; nenhuma concessão automática."
  end
end
