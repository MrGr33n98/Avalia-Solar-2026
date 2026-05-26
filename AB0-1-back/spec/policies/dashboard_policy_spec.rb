# frozen_string_literal: true

require 'rails_helper'
require 'pundit/rspec'

RSpec.describe DashboardPolicy do
  subject { described_class }

  let(:admin_user) { build(:user, role: 'admin') }
  let(:review_user) { build(:user, role: 'review') }
  let(:company_user) { build(:user, role: 'company') }
  let(:guest_user) { nil }

  # No Pundit, o record passado pode ser o proprio symbol :dashboard
  let(:record) { :dashboard }

  permissions :stats? do
    it 'concede acesso para role admin' do
      expect(subject).to permit(admin_user, record)
    end

    it 'concede acesso para role review' do
      expect(subject).to permit(review_user, record)
    end

    it 'nega acesso para role company' do
      expect(subject).not_to permit(company_user, record)
    end

    it 'nega acesso para visitantes' do
      expect(subject).not_to permit(guest_user, record)
    end
  end

  permissions :charts? do
    it 'concede acesso para role admin' do
      expect(subject).to permit(admin_user, record)
    end

    it 'concede acesso para role review' do
      expect(subject).to permit(review_user, record)
    end

    it 'nega acesso para role company' do
      expect(subject).not_to permit(company_user, record)
    end

    it 'nega acesso para visitantes' do
      expect(subject).not_to permit(guest_user, record)
    end
  end

  permissions :activity? do
    it 'concede acesso para role admin' do
      expect(subject).to permit(admin_user, record)
    end

    it 'concede acesso para role review' do
      expect(subject).to permit(review_user, record)
    end

    it 'nega acesso para role company' do
      expect(subject).not_to permit(company_user, record)
    end

    it 'nega acesso para visitantes' do
      expect(subject).not_to permit(guest_user, record)
    end
  end
end
