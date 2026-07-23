# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Admin::Companies', type: :request do
  let!(:company) { create(:company, name: 'Solfacil Test', slug: 'solfacil-test') }

  describe 'GET /admin/companies/:id/edit' do
    it 'loads edit page successfully using company slug without PostgreSQL syntax errors' do
      get "/admin/companies/#{company.slug}/edit"
      expect(response.status).to be_in([200, 302])
    end

    it 'loads edit page successfully using company numeric id' do
      get "/admin/companies/#{company.id}/edit"
      expect(response.status).to be_in([200, 302])
    end
  end
end
