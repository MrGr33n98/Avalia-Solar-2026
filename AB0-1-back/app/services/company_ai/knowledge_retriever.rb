# frozen_string_literal: true

module CompanyAi
  # Read-only domain service. Only PUBLIC, published, tenant-scoped data is returned.
  # Document binary extraction and embeddings are intentionally excluded from V1.
  class KnowledgeRetriever
    MAX_FAQS = 15
    MAX_PRODUCTS = 12

    def self.call(company:)
      new(company).call
    end

    def initialize(company)
      @company = company
    end

    def call
      return [] unless @company&.status == 'active'

      evidence = []
      @company.company_faqs.published_only.order(position: :asc).limit(MAX_FAQS).each do |faq|
        evidence << { id: "faq:#{faq.id}", kind: 'faq', version: faq.updated_at&.iso8601,
                      question: faq.question.to_s.first(200), answer: faq.answer.to_s.first(1200) }
      end
      products = ::Product.where(id: @company.company_products.visible.select(:product_id))
                          .where(status: 'active').order(id: :asc).limit(MAX_PRODUCTS)
      products.each do |product|
        evidence << { id: "product:#{product.id}", kind: 'product', version: product.updated_at&.iso8601,
                      name: product.name.to_s.first(180), description: product.description.to_s.first(1200) }
      end

      evidence
    end
  end
end
