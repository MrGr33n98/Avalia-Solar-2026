# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Corporate authentication links', type: :view do
  it 'uses the Rails admin route on the corporate landing page' do
    render template: 'corporate/index'

    expect(rendered).to include('href="/admin/login"')
    expect(rendered).not_to include('localhost:3001')
  end

  it 'uses the Rails admin route on the corporate login page' do
    render template: 'corporate/login'

    expect(rendered).to include('href="/admin/login"')
    expect(rendered).not_to include('localhost:3001')
  end
end
