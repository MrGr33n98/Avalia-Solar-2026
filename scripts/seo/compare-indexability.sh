#!/usr/bin/env bash
# CDSI-121: Compara decisões de IndexabilityPolicy entre shadow mode e enforce mode
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
REPORT_PATH="${1:-${ROOT_DIR}/tmp/category_indexability_comparison.json}"

mkdir -p "$(dirname "${REPORT_PATH}")"

echo "==> [CDSI-121] Gerando comparativo de IndexabilityPolicy (shadow vs enforce)..."

cd "${ROOT_DIR}/AB0-1-back"

bundle exec rails runner '
  rows = Category.order(:id).map do |cat|
    shadow = CategoryDiscovery::IndexabilityPolicy.evaluate(cat, mode: "shadow")
    enforce = CategoryDiscovery::IndexabilityPolicy.evaluate(cat, mode: "enforce")
    {
      id: cat.id,
      slug: cat.seo_url,
      status: cat.status,
      shadow_indexable: shadow.indexable?,
      enforce_indexable: enforce.indexable?,
      would_change_on_enforce: shadow.indexable? != enforce.indexable?,
      reason_codes: enforce.reason_codes,
      word_count: enforce.word_count,
      published_faqs_count: enforce.published_faqs_count,
      active_solution_types_count: enforce.active_solution_types_count,
      eligible_companies_count: enforce.eligible_companies_count
    }
  end

  summary = {
    generated_at: Time.current.iso8601,
    total_categories: rows.size,
    shadow_indexable_count: rows.count { |r| r[:shadow_indexable] },
    enforce_indexable_count: rows.count { |r| r[:enforce_indexable] },
    would_deindex_count: rows.count { |r| r[:would_change_on_enforce] },
    categories: rows
  }

  puts JSON.pretty_generate(summary)
' > "${REPORT_PATH}"

echo "==> Relatório salvo em: ${REPORT_PATH}"

