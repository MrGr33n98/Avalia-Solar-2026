require 'test_helper'
require 'minitest/mock'

class Api::V1::Chat::MessagesControllerTest < ActionDispatch::IntegrationTest
  setup do
    @category = Category.find_or_create_by!(seo_url: 'energia-solar') do |c|
      c.name = 'Energia Solar'
      c.description = 'Categoria de Energia Solar'
    end

    @company = Company.create!(
      name: 'MobiVolt Test',
      description: 'Empresa teste para chat',
      segment: 'installer',
      status: 'active',
      slug: "mobivolt-test-#{SecureRandom.hex(4)}",
      phone: '11999999999',
      email: 'mobivolt-test@example.com',
      state: 'SP',
      city: 'São Paulo',
      categories: [@category]
    )
    
    @user_a = User.create!(
      name: 'Usuário A',
      email: "usera-#{SecureRandom.hex(4)}@example.com",
      password: 'Password123',
      confirmed_at: Time.current,
      terms_accepted: true,
      role: 'company',
      company: @company
    )

    @user_b = User.create!(
      name: 'Usuário B',
      email: "userb-#{SecureRandom.hex(4)}@example.com",
      password: 'Password123',
      confirmed_at: Time.current,
      terms_accepted: true,
      role: 'company'
    )

    @session = ChatSession.create!(visitor_id: 'visitor-123')
  end

  def auth_headers(user)
    token = JWT.encode({ user_id: user.id }, Rails.application.secret_key_base, 'HS256')
    { 'Authorization' => "Bearer #{token}" }
  end

  test "permite enviar mensagem anonimamente em nova sessao e mantem user_id como nil" do
    # Stub OrchestratorService.process para não chamar a OpenAI real
    Chat::OrchestratorService.stub(:process, ->(session:, user_message:, &block) { block.call("Resposta", true, {}) }) do
      post "/api/v1/chat/sessions/#{@session.id}/messages", params: { content: 'Olá IA' }
      assert_response :success
      assert_nil @session.reload.user_id
    end
  end

  test "associa o user_id da sessao de chat ao usuario logado na primeira mensagem autenticada" do
    Chat::OrchestratorService.stub(:process, ->(session:, user_message:, &block) { block.call("Resposta", true, {}) }) do
      post "/api/v1/chat/sessions/#{@session.id}/messages", 
           params: { content: 'Olá IA, estou logado' }, 
           headers: auth_headers(@user_a)
           
      assert_response :success
      assert_equal @user_a.id, @session.reload.user_id
    end
  end

  test "permite que o proprietario da sessao envie mensagens se a sessao ja estiver associada" do
    @session.update!(user_id: @user_a.id)

    Chat::OrchestratorService.stub(:process, ->(session:, user_message:, &block) { block.call("Resposta", true, {}) }) do
      post "/api/v1/chat/sessions/#{@session.id}/messages", 
           params: { content: 'Minha sessão' }, 
           headers: auth_headers(@user_a)
           
      assert_response :success
    end
  end

  test "rejeita requisicoes anonimas se a sessao ja pertence a um usuario" do
    @session.update!(user_id: @user_a.id)

    post "/api/v1/chat/sessions/#{@session.id}/messages", params: { content: 'Tentativa anônima' }
    
    assert_response :forbidden
    assert_equal 'FORBIDDEN_SESSION', JSON.parse(response.body)['code']
  end

  test "rejeita requisicoes de outros usuarios se a sessao ja pertence a um usuario" do
    @session.update!(user_id: @user_a.id)

    post "/api/v1/chat/sessions/#{@session.id}/messages", 
         params: { content: 'Invasão' }, 
         headers: auth_headers(@user_b)
         
    assert_response :forbidden
    assert_equal 'FORBIDDEN_SESSION', JSON.parse(response.body)['code']
  end
end
