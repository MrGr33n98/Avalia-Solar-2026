# frozen_string_literal: true

ActiveAdmin.register_page 'Conteudo' do
  menu priority: 6, label: 'Conteúdo'

  content title: 'Central de Conteúdo' do
    tabs = [
      ['Visão Geral', admin_conteudo_path],
      ['Artigos (Blog)', admin_articles_path],
      ['Páginas SEO Locais', admin_seo_landing_pages_path],
      ['FAQs Globais', admin_faqs_path],
      ['FAQs das Empresas', admin_company_faqs_path],
      ['Perguntas do Fórum', admin_forum_questions_path],
      ['Respostas do Fórum', admin_forum_answers_path],
      ['Ativos Digitais', admin_digital_assets_path],
      ['Materiais das Empresas', admin_company_materials_path],
      ['Downloads de Materiais', admin_material_downloads_path],
      ['Decisões de Moderação', admin_content_moderation_decisions_path]
    ]

    div class: 'conteudo-hub-tabs', style: 'display:flex;gap:8px;flex-wrap:wrap;margin-bottom:20px;' do
      tabs.each_with_index do |(label, path), index|
        link_to label, path, class: "button #{index.zero? ? 'primary' : ''}"
      end
      nil
    end

    columns do
      column do
        panel 'Artigos Publicados' do
          h2 number_with_delimiter(Article.count, delimiter: '.')
          span 'Artigos no blog editorial'
        end
      end
      column do
        panel 'Rotas de SEO Local' do
          h2 number_with_delimiter(SeoLandingPage.count, delimiter: '.')
          span 'Páginas SEO por Cidade/UF'
        end
      end
      column do
        panel 'Downloads Efetuados' do
          h2 number_with_delimiter(MaterialDownload.count, delimiter: '.')
          span 'Downloads totais de materiais ricos'
        end
      end
      column do
        panel 'Perguntas do Fórum' do
          h2 number_with_delimiter(ForumQuestion.count, delimiter: '.')
          span 'Perguntas da comunidade'
        end
      end
    end

    columns do
      column do
        panel 'Materiais de Empresas' do
          table_for CompanyMaterial.order(created_at: :desc).limit(5) do
            column('Título') { |material| material.title }
            column('Empresa') { |material| material.company&.name || '—' }
            column('Status') { |material| status_tag material.status }
            column('Ações') { |material| link_to 'Visualizar', admin_company_material_path(material) }
          end
        end
      end

      column do
        panel 'Últimos Artigos Editados' do
          table_for Article.order(updated_at: :desc).limit(5) do
            column('Título') { |article| article.title }
            column('Status') { |article| status_tag(article.status == 'published' ? 'Publicado' : 'Rascunho') }
            column('Data') { |article| article.updated_at.strftime('%d/%m/%Y %H:%M') }
            column('Ações') { |article| link_to 'Editar', edit_admin_article_path(article) }
          end
        end
      end
    end
  end
end
