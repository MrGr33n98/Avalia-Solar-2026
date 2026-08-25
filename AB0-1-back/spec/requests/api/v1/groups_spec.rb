require 'rails_helper'

RSpec.describe 'Groups API', type: :request do
  let(:owner) { create(:user, role: 'review') }
  let(:member) { create(:user, role: 'review') }
  let(:outsider) { create(:user, role: 'review') }
  let(:group) { create(:group, owner: owner) }

  around do |example|
    original = ENV['GROUPS_ENABLED']
    ENV['GROUPS_ENABLED'] = 'true'
    example.run
    ENV['GROUPS_ENABLED'] = original
  end

  describe 'GET /api/v1/groups' do
    it 'lista somente grupos públicos ativos' do
      public_group = group
      private_group = create(:group, owner: owner, visibility: 'private_hidden')

      get '/api/v1/groups'

      expect(response).to have_http_status(:ok)
      ids = response.parsed_body.fetch('data').pluck('id')
      expect(ids).to include(public_group.id)
      expect(ids).not_to include(private_group.id)
    end

    it 'retorna 404 quando feature está desligada' do
      ENV['GROUPS_ENABLED'] = 'false'

      get '/api/v1/groups'

      expect(response).to have_http_status(:not_found)
    end
  end

  describe 'GET /api/v1/groups/:slug' do
    it 'mostra grupo público para visitante com capabilities' do
      get "/api/v1/groups/#{group.slug}"

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body.dig('data', 'permissions')).to include('can_join' => false)
    end

    it 'não revela grupo privado a usuário não membro' do
      group.update!(visibility: 'private_hidden')

      get "/api/v1/groups/#{group.slug}", headers: auth_headers_for(outsider)

      expect(response).to have_http_status(:not_found)
    end
  end

  describe 'membership' do
    it 'entra, consulta e sai de grupo público' do
      post "/api/v1/groups/#{group.slug}/join", headers: auth_headers_for(member)
      expect(response).to have_http_status(:ok)
      expect(response.parsed_body.dig('data', 'status')).to eq('active')

      get "/api/v1/groups/#{group.slug}/membership", headers: auth_headers_for(member)
      expect(response).to have_http_status(:ok)

      delete "/api/v1/groups/#{group.slug}/join", headers: auth_headers_for(member)
      expect(response).to have_http_status(:ok)
      expect(response.parsed_body.dig('data', 'status')).to eq('left')
    end

    it 'bloqueia acesso aos membros de grupo privado sem membership' do
      group.update!(visibility: 'private_hidden')

      get "/api/v1/groups/#{group.slug}/members", headers: auth_headers_for(outsider)

      expect(response).to have_http_status(:not_found)
    end

    it 'não cria memberships duplicadas em duas tentativas concorrentes' do
      threads = 2.times.map do
        Thread.new { Groups::MembershipService.join(group: group, user: member) }
      end
      threads.each(&:join)

      expect(group.reload.group_memberships.where(user: member).count).to eq(1)
    end
  end

  describe 'topics e rules' do
    it 'lista somente topics e rules ativos de grupo visível' do
      active_topic = create(:group_topic, group: group)
      create(:group_topic, group: group, active: false, slug: 'inativo')
      active_rule = create(:group_rule, group: group)
      create(:group_rule, group: group, active: false, title: 'Regra inativa')

      get "/api/v1/groups/#{group.slug}/topics"
      expect(response).to have_http_status(:ok)
      expect(response.parsed_body.fetch('data').pluck('id')).to eq([active_topic.id])

      get "/api/v1/groups/#{group.slug}/rules"
      expect(response).to have_http_status(:ok)
      expect(response.parsed_body.fetch('data').pluck('id')).to eq([active_rule.id])
    end

    it 'não revela topics ou rules de grupo privado a não membro' do
      group.update!(visibility: 'private_hidden')

      get "/api/v1/groups/#{group.slug}/topics", headers: auth_headers_for(outsider)
      expect(response).to have_http_status(:not_found)

      get "/api/v1/groups/#{group.slug}/rules", headers: auth_headers_for(outsider)
      expect(response).to have_http_status(:not_found)
    end
  end

  describe 'POST /api/v1/groups' do
    it 'cria grupo e não aceita atributos administrativos' do
      post '/api/v1/groups',
           params: { group: { name: 'Grupo API', slug: 'grupo-api', official: true, owner_id: outsider.id } },
           headers: auth_headers_for(owner)

      expect(response).to have_http_status(:created)
      created = Group.find_by!(slug: 'grupo-api')
      expect(created.owner_id).to eq(owner.id)
      expect(created.official).to be(false)
    end

    it 'bloqueia update de grupo de outro usuário' do
      patch "/api/v1/groups/#{group.slug}",
            params: { group: { name: 'Alteração indevida' } },
            headers: auth_headers_for(outsider)

      expect(response).to have_http_status(:forbidden).or have_http_status(:not_found)
      expect(group.reload.name).not_to eq('Alteração indevida')
    end
  end

  private

  def auth_headers_for(user)
    token = JWT.encode({ user_id: user.id, typ: 'access' }, Rails.application.secret_key_base, 'HS256')
    { 'Authorization' => "Bearer #{token}" }
  end
end