# frozen_string_literal: true

ActiveAdmin.register KnowledgeArticle do
  menu false

  permit_params :title, :slug, :content, :category_id, :status, :published_at

  controller do
    rescue_from ActiveRecord::RecordNotFound do |e|
      Rails.logger.error("ActiveAdmin KnowledgeArticle Not Found: #{e.message} | ID: #{params[:id]}")
      redirect_to admin_knowledge_articles_path,
                  alert: "Artigo não encontrado. O ID fornecido (#{params[:id]}) é inválido ou o artigo foi excluído."
    end
  end

  filter :title
  filter :status, as: :select, collection: [%w[Rascunho draft], %w[Publicado published]]
  filter :category
  filter :created_at

  index do
    selectable_column
    id_column
    column :title
    column :category
    column :status do |article|
      status_tag article.status
    end
    column :published_at
    column :created_at
    actions
  end

  show do
    attributes_table do
      row :title
      row :slug
      row :category
      row :status do |article|
        status_tag article.status
      end
      row :published_at
      row :content do |article|
        simple_format article.content
      end
      row :created_at
      row :updated_at
    end
    active_admin_comments
  end

  form do |f|
    f.inputs 'Artigo de Conhecimento' do
      f.input :title
      f.input :slug, hint: 'Deixe em branco para gerar automaticamente a partir do título'
      f.input :category, as: :select, input_html: { class: 'select2-input' }
      f.input :status, as: :select, collection: [%w[Rascunho draft], %w[Publicado published]],
                       include_blank: false
      f.input :published_at, as: :datepicker
      f.input :content, as: :text, input_html: { rows: 10 },
                        hint: 'Escreva a resposta ou artigo técnico em formato de texto simples ou Markdown.'
    end
    f.actions
  end
end
