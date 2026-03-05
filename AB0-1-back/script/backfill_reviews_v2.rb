# Backfill Reviews V2
# Usage: rails runner AB0-1-back/script/backfill_reviews_v2.rb

puts "🚀 Iniciando Backfill de Reviews (Solar Reviews 2.0)..."

Review.where(category_id: nil).find_each do |review|
  # 1. Atribui categoria baseada na primeira categoria associada à empresa
  # (Simulando categoria primária via join categories_companies)
  primary_category = review.company.categories.first

  if primary_category
    review.update_columns(category_id: primary_category.id)
    print "."
  else
    print "x" # Empresa sem categoria
  end

  # 2. Backfill de Snapshots para reviews que já possuem criteria_scores (MVP 1.1)
  review.review_criterion_scores.find_each do |score|
    if score.title_snapshot.blank?
      score.update_columns(
        title_snapshot: score.rating_criterion.title,
        weight_snapshot: score.rating_criterion.weight
      )
    end
  end

  # 3. Marcar como legada (conforme migration anterior)
  review.update_columns(is_legacy: true) if review.respond_to?(:is_legacy)
end

puts "
✅ Backfill concluído."
puts "Nota: Reviews marcadas com 'x' precisam de revisão manual (Empresa sem categoria)."
