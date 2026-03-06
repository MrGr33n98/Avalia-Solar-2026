# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Notifications API', type: :request do
  let(:user) { create(:user) }
  let(:company) { create(:company) }
  let(:company_user) { create(:user, role: 'company_user', company: company) }
  let(:auth_token) { "Bearer #{JWT.encode({ user_id: company_user.id }, Rails.application.secret_key_base, 'HS256')}" }

  describe 'GET /api/v1/notifications' do
    let!(:notification1) { create(:notification, user: company_user, notification_type: 'new_review', read_at: nil) }
    let!(:notification2) { create(:notification, user: company_user, notification_type: 'new_lead', read_at: Time.current) }

    it 'returns user notifications' do
      get '/api/v1/notifications', headers: { 'Authorization' => auth_token }
      
      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json['data'].length).to eq(2)
    end

    it 'includes unread count in meta' do
      get '/api/v1/notifications', headers: { 'Authorization' => auth_token }
      
      json = JSON.parse(response.body)
      expect(json['meta']['unread_count']).to eq(1)
    end
  end

  describe 'GET /api/v1/notifications/unread_count' do
    let!(:unread) { create_list(:notification, 3, user: company_user, read_at: nil) }
    let!(:read) { create(:notification, user: company_user, read_at: Time.current) }

    it 'returns unread count' do
      get '/api/v1/notifications/unread_count', headers: { 'Authorization' => auth_token }
      
      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json['unread_count']).to eq(3)
    end
  end

  describe 'POST /api/v1/notifications/:id/mark_as_read' do
    let!(:notification) { create(:notification, user: company_user, read_at: nil) }

    it 'marks notification as read' do
      post "/api/v1/notifications/#{notification.id}/mark_as_read", 
           headers: { 'Authorization' => auth_token }
      
      expect(response).to have_http_status(:ok)
      expect(notification.reload.read?).to be true
    end
  end

  describe 'POST /api/v1/notifications/mark_all_as_read' do
    let!(:notifications) { create_list(:notification, 5, user: company_user, read_at: nil) }

    it 'marks all notifications as read' do
      post '/api/v1/notifications/mark_all_as_read', 
           headers: { 'Authorization' => auth_token }
      
      expect(response).to have_http_status(:ok)
      expect(company_user.notifications.unread.count).to eq(0)
    end
  end

  describe 'notification creation' do
    it 'creates notification when review is created' do
      expect {
        create(:review, company: company, status: :approved)
      }.to change { company_user.reload.notifications.count }.by(1)

      notification = company_user.notifications.last
      expect(notification.notification_type).to eq('new_review')
    end

    it 'creates notification when lead is created' do
      expect {
        create(:lead, company: company)
      }.to change { company_user.reload.notifications.count }.by(1)

      notification = company_user.notifications.last
      expect(notification.notification_type).to eq('new_lead')
    end

    it 'creates notification when review reply is added' do
      review = create(:review, company: company, user: user)
      
      expect {
        review.update!(reply: 'Obrigado pelo feedback!')
      }.to change { user.notifications.count }.by(1)

      notification = user.notifications.last
      expect(notification.notification_type).to eq('reply_received')
    end
  end
end
