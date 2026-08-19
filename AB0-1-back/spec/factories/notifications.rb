# frozen_string_literal: true

FactoryBot.define do
  factory :notification do
    association :user
    notification_type { 'new_review' }
    title { 'Nova notificação' }
    message { 'Você tem uma nova notificação' }
    delivery_channels { ['in_app'] }
    read_at { nil }
    sent_at { nil }

    trait :read do
      read_at { Time.current }
    end

    trait :sent do
      sent_at { Time.current }
    end

    trait :new_review do
      notification_type { 'new_review' }
      title { 'Nova avaliação recebida' }
      message { '5 estrelas - Excelente atendimento' }
    end

    trait :new_lead do
      notification_type { 'new_lead' }
      title { 'Nova oportunidade recebida' }
      message { 'Energia Solar - Residencial' }
    end

    trait :reply_received do
      notification_type { 'reply_received' }
      title { 'Empresa respondeu sua avaliação' }
      message { 'Solar Inc respondeu sua avaliação' }
    end

    trait :status_update do
      notification_type { 'status_update' }
      title { 'Atualização de status' }
      message { 'Seu perfil foi aprovado' }
    end
  end
end
