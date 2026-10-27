# frozen_string_literal: true

class SeedSalesOnboardingPipeline < ActiveRecord::Migration[7.0]
  def up
    pipeline = ::Sales::Pipeline.find_or_create_by!(key: 'onboarding_solar') do |p|
      p.name = 'Onboarding de Clientes'
      p.active = true
    end

    onboarding_stages = [
      ['kickoff', 'Boas-vindas & Kickoff', 15, nil],
      ['document_collection', 'Coleta de Documentação', 35, nil],
      ['engineering_review', 'Engenharia & Homologação', 60, nil],
      ['implementation', 'Instalação & Configuração', 80, nil],
      ['training_golive', 'Treinamento & Go-Live', 95, nil],
      ['completed', 'Onboarding Concluído', 100, 'won'],
      ['churned', 'Cancelado / Desistência', 0, 'lost']
    ]

    onboarding_stages.each_with_index do |(stage_key, stage_name, probability, terminal), position|
      pipeline.stages.find_or_create_by!(key: stage_key) do |s|
        s.name = stage_name
        s.position = position + 1
        s.probability = probability
        s.terminal_type = terminal
        s.active = true
      end
    end
  end

  def down
    pipeline = ::Sales::Pipeline.find_by(key: 'onboarding_solar')
    pipeline&.destroy
  end
end
