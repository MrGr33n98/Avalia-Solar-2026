# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Avalia Solar mailer identity', type: :mailer do
  let(:user) do
    create(
      :user,
      name: 'Marina',
      role: 'review',
      status: :active,
      city: 'Florianópolis',
      state: 'SC',
      confirmed_at: Time.current
    )
  end
  let(:company) { create(:company, name: 'Solar Exemplo', status: 'active', moderation_status: 'approved') }
  let(:review) do
    create(
      :review,
      user: user,
      company: company,
      rating: 4,
      comment: 'Atendimento claro e instalação bem executada.',
      reply: 'Obrigado por compartilhar sua experiência.'
    )
  end

  def html_part(mail)
    mail.html_part&.decoded || mail.body.decoded
  end

  def text_part(mail)
    mail.text_part&.decoded
  end

  shared_examples 'a branded multipart email' do
    it 'uses the official absolute logo with PNG fallback and safe branding' do
      html = html_part(subject)

      expect(html).to include('https://www.avaliasolar.com.br/images/avalia-solar-logo-horizontal.svg')
      expect(html).to include('https://www.avaliasolar.com.br/images/avalia-solar-logo-horizontal.png')
      expect(html).to include('alt="Avalia Solar"')
      expect(html).to include('width="190"')
      expect(html).not_to include('AB0-1')
      expect(html).not_to include('⚡')
      expect(html).not_to match(/[A-Z]:\\/i)
      expect(html).not_to include('https://https://')
    end

    it 'provides equivalent HTML and plain-text versions' do
      expect(subject.mime_type).to eq('multipart/alternative')
      expect(subject.html_part).to be_present
      expect(subject.text_part).to be_present
      expect(text_part(subject)).to include('Equipe Avalia Solar')
      expect(text_part(subject)).to include('https://www.avaliasolar.com.br')
    end
  end

  describe 'confirmation email' do
    subject(:mail) { UserMailer.email_confirmation(user, 'token-seguro') }

    it_behaves_like 'a branded multipart email'

    it 'renders subject, CTA and token link with accented text' do
      expect(mail.subject).to eq('Confirme seu e-mail')
      expect(html_part(mail)).to include('Confirmar meu e-mail')
      expect(text_part(mail)).to include('/confirm-email#token=token-seguro')
    end
  end

  describe 'password reset email' do
    subject(:mail) { UserMailer.reset_password_instructions(user, 'reset-seguro') }

    it_behaves_like 'a branded multipart email'

    it 'renders the reset CTA and complete URL' do
      expect(mail.subject).to eq('Redefinição de senha')
      expect(html_part(mail)).to include('Redefinir minha senha')
      expect(text_part(mail)).to include('/reset-password#token=reset-seguro')
    end
  end

  describe 'company access email' do
    subject(:mail) { CompanyAccessMailer.access_granted(user, company) }

    it_behaves_like 'a branded multipart email'

    it 'preserves company context and dashboard CTA' do
      expect(html_part(mail)).to include(company.name)
      expect(html_part(mail)).to include('Acessar painel da empresa')
      expect(text_part(mail)).to include("company_id=#{company.id}")
    end
  end

  describe 'review reply email' do
    subject(:mail) { ReviewMailer.new_reply(review) }

    it_behaves_like 'a branded multipart email'

    it 'preserves the reply and public company link' do
      expect(html_part(mail)).to include(review.reply)
      expect(text_part(mail)).to include("/companies/#{company.slug || company.id}")
    end
  end

  it 'keeps all production mail templates free of legacy identity and local paths' do
    mailer_directories = %w[
      user_mailer company_mailer company_access_mailer lead_verification_mailer
      notification_mailer review_decision_mailer review_mailer devise/mailer
    ].join(',')
    templates = Rails.root.glob("app/views/{#{mailer_directories}}/**/*.{erb,haml}")
    templates.concat(Rails.root.glob('app/views/layouts/mailer*.erb'))
    combined = templates.map(&:read).join("\n")

    expect(combined).not_to include('AB0-1')
    expect(combined).not_to include('⚡')
    expect(combined).not_to include('/images/logo.png')
    expect(combined).not_to include('media.licdn.com')
    expect(combined).not_to match(/[A-Z]:\\/i)
    expect(combined).not_to include('https://https://')
  end

  it 'has a plain-text sibling for every production HTML template' do
    directories = %w[
      user_mailer company_mailer company_access_mailer lead_verification_mailer
      notification_mailer review_decision_mailer review_mailer devise/mailer
    ]
    html_templates = directories.flat_map { |directory| Rails.root.glob("app/views/#{directory}/*.html.erb") }
    missing = html_templates.reject { |path| path.sub_ext('').sub_ext('.text.erb').exist? }

    expect(missing).to be_empty, "Missing text templates: #{missing.join(', ')}"
  end
end
