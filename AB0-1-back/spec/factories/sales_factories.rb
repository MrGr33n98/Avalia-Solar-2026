# frozen_string_literal: true

FactoryBot.define do
  factory :sales_campaign, class: 'Sales::Campaign' do
    association :company
    association :user
    sequence(:name) { |n| "Campanha Solar #{n}" }
    campaign_type { 'email_broadcast' }
    status { 'draft' }
  end

  factory :sales_campaign_recipient, class: 'Sales::CampaignRecipient' do
    association :company
    association :campaign, factory: :sales_campaign
    sequence(:email) { |n| "destinatario-#{n}@exemplo.com.br" }
    status { 'pending' }
  end

  factory :sales_email_message, class: 'Sales::EmailMessage' do
    association :company
    association :campaign, factory: :sales_campaign
    association :campaign_recipient, factory: :sales_campaign_recipient
    sequence(:from_email) { |n| "remetente-#{n}@empresa.com.br" }
    sequence(:to_email) { |n| "destinatario-#{n}@exemplo.com.br" }
    subject { 'Assunto de Teste' }
    body_html { '<p>Conteúdo de teste</p>' }
    status { 'queued' }
  end

  factory :sales_email_template, class: 'Sales::EmailTemplate' do
    association :company
    association :user
    sequence(:name) { |n| "Modelo de E-mail #{n}" }
    subject_template { 'Olá {{first_name}}, confira a proposta' }
    body_html { '<p>Olá {{first_name}}</p>' }
    status { 'active' }
  end

  factory :sales_account, class: 'Sales::Account' do
    association :company
    association :owner, factory: :user
    sequence(:name) { |n| "Empresa Cliente #{n}" }
    sequence(:domain) { |n| "cliente-#{n}.com.br" }
  end
end
