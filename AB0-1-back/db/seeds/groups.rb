# frozen_string_literal: true

require 'securerandom'

module Seeds
  module Groups
    module_function

    def run!
      puts "\n==> Criando Comunidades Iniciais"

      # 1. Garantir owner oficial válido
      owner = User.find_or_initialize_by(email: 'comunidades@avaliasolar.com.br')
      if owner.new_record?
        owner.assign_attributes(
          name: 'Comunidades Avalia Solar',
          role: 'review',
          status: 'active',
          city: 'São Paulo',
          state: 'SP',
          password: 'Aa1' + SecureRandom.hex(10), # Complexidade senha
          terms_accepted: true,
          terms_accepted_at: Time.current,
          confirmed_at: Time.current,
          public_name_consent: true,
          display_full_name_consent: true,
          review_name_consent: true,
          lgpd_name_consent: true
        )
        owner.skip_confirmation! if owner.respond_to?(:skip_confirmation!)
        owner.save!
        puts "  ✓ Criado usuário owner oficial: #{owner.email}"
      else
        puts "  • Usuário owner oficial já existe: #{owner.email}"
      end

      # 2. Definir comunidades iniciais
      comunidades = [
        {
          name: 'Energia Solar',
          slug: 'energia-solar',
          short_description: 'Comunidade geral sobre energia solar fotovoltaica no Brasil.',
          description: 'Espaço para debater projetos fotovoltaicos, dimensionamento, marcas de inversores, painéis solares e regulamentações do setor.',
          category_slug: 'energia-solar',
          featured: true,
          official: true
        },
        {
          name: 'Baterias e Armazenamento',
          slug: 'baterias-e-armazenamento',
          short_description: 'Debates sobre baterias de lítio, chumbo-ácido, sistemas híbridos e off-grid.',
          description: 'Espaço voltado a integradores e entusiastas de sistemas de armazenamento de energia (BESS), baterias de lítio e aplicações híbridas.',
          category_slug: 'baterias-armazenamento',
          featured: true,
          official: true
        },
        {
          name: 'Mobilidade Elétrica',
          slug: 'mobilidade-eletrica',
          short_description: 'Discussões sobre veículos elétricos, carregadores wallbox e infraestrutura de recarga.',
          description: 'A maior comunidade do Brasil para debater recarga rápida de veículos elétricos, carregadores wallbox e mobilidade urbana.',
          category_slug: 'mobilidade-eletrica',
          featured: true,
          official: true
        },
        {
          name: 'Mercado Livre de Energia',
          slug: 'mercado-livre-de-energia',
          short_description: 'Tudo sobre o Ambiente de Contratação Livre (ACL) e mercado livre de energia.',
          description: 'Fórum para discutir migração para o mercado livre, comercializadoras de energia, contratos ACL e economia para consumidores comerciais e industriais.',
          category_slug: 'mercado-legislacao-financas',
          featured: true,
          official: true
        },
        {
          name: 'Instaladores e Integradores',
          slug: 'instaladores-e-integradores',
          short_description: 'Comunidade exclusiva para profissionais de instalação e integração fotovoltaica.',
          description: 'Fórum técnico para instaladores debaterem boas práticas de montagem, segurança no trabalho, ferramentas e desafios do dia a dia.',
          category_slug: 'instaladores-energia-solar',
          featured: false,
          official: true
        },
        {
          name: 'Projetistas e Engenharia',
          slug: 'projetistas-e-engenharia',
          short_description: 'Espaço técnico para engenharia, diagramas unifilares e projetos de homologação.',
          description: 'Discussão técnica sobre projetos elétricos de usinas solares, modelagem 3D, simulação no PVsyst e processos de homologação nas distribuidoras.',
          category_slug: 'energia-solar',
          featured: false,
          official: true
        },
        {
          name: 'Fabricantes e Distribuidores',
          slug: 'fabricantes-e-distribuidores',
          short_description: 'Informações sobre fornecimento de equipamentos, garantia e logística.',
          description: 'Troca de informações e avaliações sobre distribuidores de kits solares, prazos de entrega, políticas de garantia e pós-vendas dos fabricantes.',
          category_slug: 'energia-solar',
          featured: false,
          official: true
        },
        {
          name: 'Empregos e Oportunidades',
          slug: 'empregos-e-oportunidades',
          short_description: 'Vagas de emprego, parcerias e oportunidades no mercado solar.',
          description: 'Espaço de networking para publicação de vagas de trabalho, contratação de freelancers, parcerias de representação comercial e negócios.',
          category_slug: 'energia-solar',
          featured: false,
          official: true
        }
      ]

      comunidades.each do |data|
        group = Group.find_or_initialize_by(slug: data[:slug])
        category = Category.find_by(seo_url: data[:category_slug])

        group.assign_attributes(
          name: data[:name],
          short_description: data[:short_description],
          description: data[:description],
          status: 'active',
          visibility: 'public',
          membership_mode: 'open',
          posting_mode: 'members',
          official: data[:official],
          featured: data[:featured],
          verified: data[:official],
          owner: owner,
          category: category
        )

        is_new = group.new_record?
        group.save!

        # Garantir a filiação do owner
        membership = GroupMembership.find_or_initialize_by(group: group, user: owner)
        membership.assign_attributes(
          role: 'owner',
          status: 'active',
          joined_at: Time.current,
          approved_at: Time.current
        )
        membership.save!

        # Atualizar contadores
        group.update_columns(members_count: group.members.count, updated_at: Time.current)

        action = is_new ? "Criada" : "Atualizada"
        puts "  ✓ #{action} comunidade: #{group.name} (slug: #{group.slug}, category: #{category&.name || 'Nenhuma'})"
      end
    end
  end
end
