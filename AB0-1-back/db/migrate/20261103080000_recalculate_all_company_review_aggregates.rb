# frozen_string_literal: true

class RecalculateAllCompanyReviewAggregates < ActiveRecord::Migration[7.0]
  def up
    # 1. Sincronizar colunas polimórficas (reviewable) com company_id para consistência bidirecional
    execute <<~SQL
      UPDATE reviews
      SET reviewable_id = company_id, reviewable_type = 'Company'
      WHERE company_id IS NOT NULL AND reviewable_id IS NULL;

      UPDATE reviews
      SET company_id = reviewable_id
      WHERE company_id IS NULL AND reviewable_type = 'Company' AND reviewable_id IS NOT NULL;
    SQL

    # 2. Recalcular agregados e scores de todas as empresas com avaliações ou agregados existentes
    company_ids = (
      Review.where.not(company_id: nil).distinct.pluck(:company_id) +
      ReviewAggregate.distinct.pluck(:company_id) +
      Company.where('rating_count > 0 OR rating_avg IS NOT NULL').pluck(:id)
    ).compact.uniq

    Company.where(id: company_ids).find_each do |company|
      Reviews::AggregationService.recalculate_for_company!(company)
      PublicProfileRevalidator.call!(company) rescue nil
    end

    # 3. Limpar caches de fragmentos e endpoints no Rails
    Rails.cache.clear rescue nil
  end

  def down
    # Migração de dados idempotente de reconciliação.
  end
end
