# frozen_string_literal: true

class SuspendBankingEntitiesFromMarketplace < ActiveRecord::Migration[7.0]
  BANKING_SLUGS = %w[
    reso-comercio-engenharia-e-servicos-ltda
    banco-abc
    eletro-c-e-c
    all-energy
  ].freeze

  BANKING_IDS = [458, 459, 460, 466].freeze

  def up
    return if Rails.env.test?

    # Inativa e suspende instituições bancárias cadastradas como empresas para
    # exibir exclusivamente empresas do setor de energia solar no marketplace.
    targets = Company.where(slug: BANKING_SLUGS).or(Company.where(id: BANKING_IDS))
    count = targets.count

    if count > 0
      targets.each do |company|
        Rails.logger.info(
          "[SuspendBankingEntities] Suspendendo empresa: ID=#{company.id}, Name='#{company.name}', Slug='#{company.slug}'"
        )
      end

      targets.update_all(
        status: 'inactive',
        moderation_status: 'suspended',
        featured: false,
        updated_at: Time.current
      )

      Rails.logger.info("[SuspendBankingEntities] #{count} empresas bancárias inativadas/suspensas com sucesso.")
    else
      Rails.logger.info('[SuspendBankingEntities] Nenhuma empresa correspondente aos slugs/IDs bancários encontrada.')
    end
  end

  def down
    return if Rails.env.test?

    targets = Company.where(slug: BANKING_SLUGS).or(Company.where(id: BANKING_IDS))
    count = targets.count

    if count > 0
      targets.update_all(
        status: 'active',
        moderation_status: 'approved',
        updated_at: Time.current
      )
      Rails.logger.info("[SuspendBankingEntities] Revertendo: #{count} empresas bancárias reativadas.")
    end
  end
end

