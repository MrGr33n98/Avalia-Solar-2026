require 'test_helper'

class Articles::ContentSanitizerTest < ActiveSupport::TestCase
  test 'is idempotent for valid HTML components' do
    html = '<div class="as-cta-card" data-as-component="cta">' \
           '<h2 class="as-cta-title">Título</h2>' \
           '<p class="as-cta-description">Descrição</p>' \
           '<a class="as-btn as-btn--primary" href="/founder" data-as-track="cta_click">Conhecer</a>' \
           '</div>'
    first_pass = Articles::ContentSanitizer.call(html)
    second_pass = Articles::ContentSanitizer.call(first_pass)

    assert_equal first_pass, second_pass
    assert_includes first_pass, 'class="as-cta-card"'
    assert_includes first_pass, 'class="as-btn as-btn--primary"'
    assert_includes first_pass, 'href="/founder"'
  end

  test 'removes dangerous tags such as script, iframe, and svg' do
    malicious = '<script>alert("xss")</script><p>Normal</p><iframe src="evil.com"></iframe><svg onload="alert(1)"></svg>'
    sanitized = Articles::ContentSanitizer.call(malicious)

    refute_includes sanitized, '<script>'
    refute_includes sanitized, 'evil.com'
    refute_includes sanitized, '<svg'
    refute_includes sanitized, 'onload='
    assert_includes sanitized, '<p>Normal</p>'
  end

  test 'removes event handlers like onerror and onclick' do
    payload = '<img src="x" onerror="alert(1)" /><button onclick="pwn()">Click</button>'
    sanitized = Articles::ContentSanitizer.call(payload)

    refute_includes sanitized, 'onerror'
    refute_includes sanitized, 'onclick'
    refute_includes sanitized, '<button'
  end

  test 'removes javascript and data URLs from links' do
    payload = '<a href="javascript:alert(1)">Inseguro</a><a href="data:text/html;base64,PHNjcmlwdD4=">Data</a>'
    sanitized = Articles::ContentSanitizer.call(payload)

    refute_includes sanitized, 'javascript:'
    refute_includes sanitized, 'data:text'
  end

  test 'enforces rel noopener noreferrer on target _blank' do
    link = '<a href="https://example.com" target="_blank">Exemplo</a>'
    sanitized = Articles::ContentSanitizer.call(link)

    assert_includes sanitized, 'target="_blank"'
    assert_includes sanitized, 'rel="noopener noreferrer"'
  end

  test 'filters classes to only allowed as-*, ql-*, and text-*' do
    html = '<div class="as-cta-card bad-class arbitrary_class text-center ql-align-center"><p>Texto</p></div>'
    sanitized = Articles::ContentSanitizer.call(html)

    assert_includes sanitized, 'as-cta-card'
    assert_includes sanitized, 'text-center'
    assert_includes sanitized, 'ql-align-center'
    refute_includes sanitized, 'bad-class'
    refute_includes sanitized, 'arbitrary_class'
  end

  test 'corrects OCR typos such as fotoforos to painéis fotovoltaicos' do
    html = '<p>Os fotoforos absorvem a radiação.</p>'
    sanitized = Articles::ContentSanitizer.call(html)

    assert_includes sanitized, 'painéis fotovoltaicos'
    refute_includes sanitized, 'fotoforos'
  end
end
