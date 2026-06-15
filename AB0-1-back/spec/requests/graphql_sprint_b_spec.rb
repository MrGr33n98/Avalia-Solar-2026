# frozen_string_literal: true

require 'rails_helper'
require 'sidekiq/testing'

Sidekiq::Testing.fake!

RSpec.describe 'GraphQL Sprint B — Articles / Blog', type: :request do
  let!(:category) do
    Category.create!(
      name: 'Energia Fotovoltaica',
      seo_url: 'energia-fotovoltaica',
      description: 'Artigos sobre energia fotovoltaica',
      status: 'active'
    )
  end

  let!(:other_category) do
    Category.create!(
      name: 'Financiamento Solar',
      seo_url: 'financiamento-solar',
      description: 'Artigos sobre financiamento solar',
      status: 'active'
    )
  end

  let!(:author) do
    AdminUser.create!(
      email: 'autor.teste@avaliasolar.com',
      password: 'Password123!',
      name: 'Dr. Solar'
    )
  end

  let!(:published_article_1) do
    Article.create!(
      title: 'Como economizar energia solar residencial',
      slug: 'como-economizar-energia-solar-residencial',
      content: 'Este é o conteúdo do artigo 1 com várias palavras úteis para calcular tempo de leitura.',
      category: category,
      author: author,
      status: 'published',
      published_at: 1.day.ago,
      excerpt: 'Resumo curto do artigo 1',
      meta_title: 'SEO Economia Solar',
      meta_description: 'SEO Descrição Economia Solar'
    )
  end

  let!(:published_article_2) do
    Article.create!(
      title: 'Guia de Financiamento Solar 2026',
      slug: 'guia-de-financiamento-solar-2026',
      content: 'Este é o conteúdo do artigo 2 que fala sobre financiamento solar e taxas de juros.',
      category: other_category,
      author: author,
      status: 'published',
      published_at: 2.hours.ago,
      excerpt: 'Resumo curto do artigo 2',
      meta_title: 'SEO Financiamento Solar',
      meta_description: 'SEO Descrição Financiamento Solar'
    )
  end

  let!(:draft_article) do
    Article.create!(
      title: 'Artigo Rascunho Segredo',
      slug: 'artigo-rascunho-segredo',
      content: 'Conteúdo secreto em desenvolvimento.',
      category: category,
      author: author,
      status: 'draft',
      published_at: nil,
      excerpt: 'Resumo rascunho'
    )
  end

  describe 'Query articles' do
    let(:query) do
      <<-GRAPHQL
        query GetArticles($category: String, $q: String, $page: Int, $perPage: Int) {
          articles(category: $category, q: $q, page: $page, perPage: $perPage) {
            nodes {
              id
              title
              slug
              excerpt
              body
              coverUrl
              tags
              publishedAt
              readingTime
              authorName
              seoTitle
              seoDescription
              category {
                id
                name
                slug
              }
              relatedArticles {
                id
                title
              }
            }
            pageInfo {
              currentPage
              totalPages
              totalCount
            }
          }
        }
      GRAPHQL
    end

    it 'retorna apenas artigos publicados ordenados por data de publicação decrescente' do
      post '/graphql', params: { query: query }
      expect(response).to have_http_status(:success)
      json = JSON.parse(response.body)
      
      articles = json.dig('data', 'articles', 'nodes')
      page_info = json.dig('data', 'articles', 'pageInfo')

      expect(articles.size).to eq(2)
      # Artigo 2 publicado mais recentemente (2 horas atrás vs 1 dia atrás)
      expect(articles[0]['slug']).to eq(published_article_2.slug)
      expect(articles[1]['slug']).to eq(published_article_1.slug)
      expect(page_info['totalCount']).to eq(2)
      
      # Verifica os campos mapeados
      art1 = articles.find { |a| a['slug'] == published_article_1.slug }
      expect(art1['title']).to eq(published_article_1.title)
      expect(art1['excerpt']).to eq(published_article_1.excerpt)
      expect(art1['body']).to eq(published_article_1.content)
      expect(art1['authorName']).to eq(author.name)
      expect(art1['seoTitle']).to eq(published_article_1.meta_title)
      expect(art1['seoDescription']).to eq(published_article_1.meta_description)
      expect(art1['readingTime']).to be >= 1
      expect(art1['tags']).to eq([])
    end

    it 'permite filtrar por categoria (slug ou nome)' do
      # Filtrando por categoria "Energia Fotovoltaica"
      post '/graphql', params: { query: query, variables: { category: 'energia-fotovoltaica' } }
      json = JSON.parse(response.body)
      articles = json.dig('data', 'articles', 'nodes')
      expect(articles.size).to eq(1)
      expect(articles[0]['slug']).to eq(published_article_1.slug)
    end

    it 'permite fazer busca textual (por q)' do
      post '/graphql', params: { query: query, variables: { q: 'Financiamento' } }
      json = JSON.parse(response.body)
      articles = json.dig('data', 'articles', 'nodes')
      expect(articles.size).to eq(1)
      expect(articles[0]['slug']).to eq(published_article_2.slug)
    end
  end

  describe 'Query article(slug)' do
    let(:query) do
      <<-GRAPHQL
        query GetArticleDetail($slug: String!) {
          article(slug: $slug) {
            id
            title
            slug
            body
          }
        }
      GRAPHQL
    end

    it 'retorna os dados do artigo detalhado se estiver publicado' do
      post '/graphql', params: { query: query, variables: { slug: published_article_1.slug } }
      expect(response).to have_http_status(:success)
      json = JSON.parse(response.body)
      article_data = json.dig('data', 'article')
      expect(article_data).to be_present
      expect(article_data['title']).to eq(published_article_1.title)
    end

    it 'retorna nulo se o artigo for rascunho (draft)' do
      post '/graphql', params: { query: query, variables: { slug: draft_article.slug } }
      expect(response).to have_http_status(:success)
      json = JSON.parse(response.body)
      article_data = json.dig('data', 'article')
      expect(article_data).to be_nil
    end
  end
end
