# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Article, type: :model do
  it 'enqueues frontend invalidation for both old and new slugs after a title change' do
    article = Article.create!(
      title: 'Plano Founder original',
      category: create(:category),
      author: create(:admin_user),
      content: '<h2>Conteúdo do artigo</h2>'
    )
    old_slug = article.slug
    enqueued_slugs = nil
    allow(ArticleRevalidationJob).to receive(:perform_later) { |slugs| enqueued_slugs = slugs }

    article.update!(title: 'Plano Founder atualizado')

    expect(enqueued_slugs).to contain_exactly(old_slug, article.slug)
  end
end
