require 'test_helper'

class Api::V1::ArticlesControllerTest < ActionDispatch::IntegrationTest
  setup do
    @category = Category.find_or_create_by!(name: 'Tecnologia Solar') do |c|
      c.description = 'Categoria de teste para energia solar'
    end
    @author = AdminUser.first || AdminUser.create!(
      email: 'admin_test@avaliasolar.com.br',
      password: 'Password123!',
      name: 'Admin Test'
    )

    @published = Article.new(
      title: 'Artigo Solar Publicado',
      slug: 'artigo-solar-publicado',
      content: '<h2>O Futuro Solar</h2><p>Conteúdo publicado com sucesso.</p>',
      status: 'published',
      published_at: 1.day.ago,
      category: @category,
      author: @author
    )
    @published.save!(validate: false)

    @draft = Article.new(
      title: 'Artigo em Rascunho',
      slug: 'artigo-em-rascunho',
      content: '<h2>Rascunho Secreto</h2><p>Conteúdo confidencial ainda não publicado.</p>',
      status: 'draft',
      category: @category,
      author: @author
    )
    @draft.save!(validate: false)
  end

  teardown do
    @published&.destroy
    @draft&.destroy
  end

  test 'GET #show returns 200 and serialized content for published article' do
    get api_v1_article_url(@published.slug)
    assert_response :success

    json = JSON.parse(response.body)
    title = json['title'] || json.dig('article', 'title') || json.dig('data', 'attributes', 'title')
    slug = json['slug'] || json.dig('article', 'slug') || json.dig('data', 'attributes', 'slug')
    assert_equal @published.title, title
    assert_equal @published.slug, slug
  end

  test 'GET #show returns 404 for draft article to prevent draft exposure' do
    get api_v1_article_url(@draft.slug)
    assert_response :not_found
  end

  test 'GET #related returns 404 for draft article' do
    get related_api_v1_article_url(@draft.slug)
    assert_response :not_found
  end

  test 'POST #create is forbidden without admin credentials' do
    post api_v1_articles_url, params: {
      article: {
        title: 'Tentativa Não Autorizada',
        content: '<p>Test</p>'
      }
    }
    assert_response :forbidden
  end

  test 'DELETE #destroy is forbidden without admin credentials' do
    delete api_v1_article_url(@published.slug)
    assert_response :forbidden
  end
end
