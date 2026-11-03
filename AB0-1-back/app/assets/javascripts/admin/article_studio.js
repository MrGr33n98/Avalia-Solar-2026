/**
 * Article Studio — ActiveAdmin Editorial Extension
 * Avalia Solar (v1.0)
 * Scoped exclusively to #article_content_input in Articles admin.
 */

(function () {
  'use strict';

  function escapeHtml(text) {
    var div = document.createElement('div');
    div.textContent = text || '';
    return div.innerHTML;
  }

  function getWordCount(text) {
    if (!text) return 0;
    var clean = text.replace(/<[^>]*>/g, ' ').trim();
    if (!clean) return 0;
    return clean.split(/\s+/).filter(Boolean).length;
  }

  function insertAtCursor(textarea, textToInsert) {
    var start = textarea.selectionStart;
    var end = textarea.selectionEnd;
    var val = textarea.value;

    textarea.value = val.substring(0, start) + textToInsert + val.substring(end);
    textarea.selectionStart = textarea.selectionEnd = start + textToInsert.length;
    textarea.focus();
  }

  function initArticleStudio() {
    var container = document.getElementById('article_content_input');
    if (!container || container.dataset.asInitialized === 'true') {
      return;
    }
    container.dataset.asInitialized = 'true';

    // Locate Quill wrapper and hidden content field
    var quillWrapper = container.querySelector('.quill-editor');
    var rawTextarea = container.querySelector('textarea#article_content') ||
                      container.querySelector('input#article_content') ||
                      container.querySelector('textarea[name="article[content]"]') ||
                      container.querySelector('input[name="article[content]"]');

    if (!rawTextarea) {
      return;
    }

    var form = container.closest('form');
    var currentMode = 'visual'; // 'visual' | 'code'

    // Initial value
    var initialContent = rawTextarea.value || '';
    var hasAdvancedComponents = /class=["'][^"']*as-[^"']*["']/i.test(initialContent) ||
                                /data-as-/i.test(initialContent);

    // 1. Build Toolbar DOM
    var toolbar = document.createElement('div');
    toolbar.className = 'as-studio-toolbar';
    toolbar.innerHTML = [
      '<div class="as-toolbar-group">',
      '  <button type="button" class="as-btn-studio as-btn-mode as-mode-visual as-btn-active">✍️ Visual (Quill)</button>',
      '  <button type="button" class="as-btn-studio as-btn-mode as-mode-code">💻 HTML-Fonte (Código)</button>',
      '</div>',
      '<div class="as-toolbar-group">',
      '  <button type="button" class="as-btn-studio as-snippet-cta">+ CTA Founder</button>',
      '  <button type="button" class="as-btn-studio as-snippet-info">+ Card Info</button>',
      '  <button type="button" class="as-btn-studio as-snippet-callout">+ Callout</button>',
      '  <button type="button" class="as-btn-studio as-snippet-banner">+ Banner</button>',
      '  <button type="button" class="as-btn-studio as-snippet-table">+ Tabela</button>',
      '</div>',
      '<div class="as-toolbar-group">',
      '  <span class="as-stats-badge as-stats">0 chars | 0 palavras</span>',
      '  <button type="button" class="as-btn-studio as-btn-preview" title="Pré-visualizar artigo com o design do blog">👁️ Prévia</button>',
      '</div>'
    ].join('');

    // Safety warning element
    var warningBox = document.createElement('div');
    warningBox.className = 'as-mode-warning';
    warningBox.textContent = 'Atenção: O artigo contém componentes estruturados (.as-*). Recomendamos editar no modo HTML-Fonte para preservar todas as classes e tags.';

    // Code Editor Wrapper DOM
    var codeWrapper = document.createElement('div');
    codeWrapper.className = 'as-code-editor-wrapper';
    var codeEditor = document.createElement('textarea');
    codeEditor.className = 'as-code-editor';
    codeEditor.id = 'article_studio_code_editor';
    codeEditor.placeholder = 'Digite ou cole o código HTML do artigo aqui...';
    codeEditor.value = initialContent;
    codeWrapper.appendChild(codeEditor);

    // Insert controls before the Quill wrapper
    if (quillWrapper) {
      quillWrapper.parentNode.insertBefore(toolbar, quillWrapper);
      quillWrapper.parentNode.insertBefore(warningBox, quillWrapper);
      quillWrapper.parentNode.insertBefore(codeWrapper, quillWrapper);
    } else {
      container.appendChild(toolbar);
      container.appendChild(warningBox);
      container.appendChild(codeWrapper);
    }

    var btnVisual = toolbar.querySelector('.as-mode-visual');
    var btnCode = toolbar.querySelector('.as-mode-code');
    var statsBadge = toolbar.querySelector('.as-stats');

    function updateStats(html) {
      var len = html ? html.length : 0;
      var words = getWordCount(html);
      statsBadge.textContent = len + ' chars | ' + words + ' palavras';
    }

    function getQuillHtml() {
      if (quillWrapper) {
        var editorElem = quillWrapper.querySelector('.ql-editor');
        if (editorElem) {
          return editorElem.innerHTML;
        }
      }
      return rawTextarea.value || '';
    }

    function setQuillHtml(html) {
      if (quillWrapper) {
        var editorElem = quillWrapper.querySelector('.ql-editor');
        if (editorElem) {
          editorElem.innerHTML = html;
        }
      }
      rawTextarea.value = html;
    }

    function switchToCodeMode() {
      var currentHtml = (currentMode === 'visual') ? getQuillHtml() : codeEditor.value;
      codeEditor.value = currentHtml;
      rawTextarea.value = currentHtml;

      if (quillWrapper) {
        quillWrapper.style.display = 'none';
      }
      codeWrapper.classList.add('is-visible');
      btnCode.classList.add('as-btn-active');
      btnVisual.classList.remove('as-btn-active');
      currentMode = 'code';
      updateStats(currentHtml);
    }

    function switchToVisualMode() {
      var currentHtml = codeEditor.value;
      var hasComponents = /class=["'][^"']*as-[^"']*["']/i.test(currentHtml) || /data-as-/i.test(currentHtml);

      if (hasComponents) {
        var confirmSwitch = window.confirm(
          'Aviso: O modo visual (Quill) pode simplificar ou descartar classes e tags de componentes avançados (.as-*).\n\nDeseja continuar mesmo assim?'
        );
        if (!confirmSwitch) {
          return;
        }
      }

      setQuillHtml(currentHtml);
      if (quillWrapper) {
        quillWrapper.style.display = 'block';
      }
      codeWrapper.classList.remove('is-visible');
      btnVisual.classList.add('as-btn-active');
      btnCode.classList.remove('as-btn-active');
      currentMode = 'visual';
      updateStats(currentHtml);
    }

    // Toggle events
    btnVisual.addEventListener('click', function (e) {
      e.preventDefault();
      if (currentMode !== 'visual') switchToVisualMode();
    });

    btnCode.addEventListener('click', function (e) {
      e.preventDefault();
      if (currentMode !== 'code') switchToCodeMode();
    });

    // Sync from Code textarea on typing
    codeEditor.addEventListener('input', function () {
      rawTextarea.value = codeEditor.value;
      updateStats(codeEditor.value);
    });

    // If initial content has components, automatically start in Code Mode for protection
    if (hasAdvancedComponents) {
      warningBox.classList.add('is-visible');
      switchToCodeMode();
    } else {
      updateStats(initialContent);
    }

    // Helper: insert snippet safely
    function insertSnippet(htmlSnippet) {
      if (currentMode !== 'code') {
        switchToCodeMode();
      }
      insertAtCursor(codeEditor, '\n' + htmlSnippet + '\n');
      rawTextarea.value = codeEditor.value;
      updateStats(codeEditor.value);
    }

    // 2. CTA Builder Modal
    function openCtaModal() {
      var backdrop = document.createElement('div');
      backdrop.className = 'as-modal-backdrop';
      backdrop.innerHTML = [
        '<div class="as-modal-content" role="dialog" aria-modal="true" aria-labelledby="as-modal-title">',
        '  <h3 id="as-modal-title">Configurar CTA Founder / Comercial</h3>',
        '  <div class="as-modal-field">',
        '    <label for="as_cta_title">Título do Card:</label>',
        '    <input type="text" id="as_cta_title" value="Sua empresa pode ser referência na região." />',
        '  </div>',
        '  <div class="as-modal-field">',
        '    <label for="as_cta_desc">Descrição / Subtítulo:</label>',
        '    <input type="text" id="as_cta_desc" value="Conheça a apresentação do Plano Founder." />',
        '  </div>',
        '  <div class="as-modal-field">',
        '    <label for="as_cta_btn_text">Texto do Botão:</label>',
        '    <input type="text" id="as_cta_btn_text" value="Conhecer o Plano Founder →" />',
        '  </div>',
        '  <div class="as-modal-field">',
        '    <label for="as_cta_url">Link de Destino (URL):</label>',
        '    <input type="text" id="as_cta_url" value="/founder" placeholder="/founder ou https://..." />',
        '  </div>',
        '  <div class="as-modal-field">',
        '    <label for="as_cta_variant">Variante de Estilo:</label>',
        '    <select id="as_cta_variant">',
        '      <option value="as-btn--primary">Primário (Azul Real)</option>',
        '      <option value="as-btn--secondary">Secundário (Dark Navy)</option>',
        '      <option value="as-btn--outline">Contorno (Outline)</option>',
        '    </select>',
        '  </div>',
        '  <div class="as-modal-field">',
        '    <label class="as-checkbox-label">',
        '      <input type="checkbox" id="as_cta_newtab" /> Abrir em nova aba (target="_blank")',
        '    </label>',
        '  </div>',
        '  <div class="as-modal-actions">',
        '    <button type="button" class="as-modal-cancel">Cancelar</button>',
        '    <button type="button" class="as-modal-submit">Inserir no Artigo</button>',
        '  </div>',
        '</div>'
      ].join('');

      document.body.appendChild(backdrop);

      var inputTitle = backdrop.querySelector('#as_cta_title');
      var inputDesc = backdrop.querySelector('#as_cta_desc');
      var inputBtn = backdrop.querySelector('#as_cta_btn_text');
      var inputUrl = backdrop.querySelector('#as_cta_url');
      var selectVariant = backdrop.querySelector('#as_cta_variant');
      var checkNewTab = backdrop.querySelector('#as_cta_newtab');
      var btnCancel = backdrop.querySelector('.as-modal-cancel');
      var btnSubmit = backdrop.querySelector('.as-modal-submit');

      function closeModal() {
        if (backdrop.parentNode) {
          backdrop.parentNode.removeChild(backdrop);
        }
      }

      btnCancel.addEventListener('click', closeModal);
      backdrop.addEventListener('click', function (e) {
        if (e.target === backdrop) closeModal();
      });

      btnSubmit.addEventListener('click', function () {
        var title = inputTitle.value.trim() || 'Destaque Solar';
        var desc = inputDesc.value.trim() || '';
        var btnText = inputBtn.value.trim() || 'Saiba Mais';
        var url = inputUrl.value.trim() || '/founder';
        var variant = selectVariant.value || 'as-btn--primary';
        var isNewTab = checkNewTab.checked;

        // Security check on URL
        if (!/^(\/|https?:\/\/)/i.test(url)) {
          alert('URL inválida. Links devem começar com "/" ou "https://" ou "http://".');
          return;
        }

        var targetAttr = isNewTab ? ' target="_blank" rel="noopener noreferrer"' : '';
        var componentId = 'founder-cta-' + Date.now().toString(36);

        var ctaHtml = [
          '<div class="as-cta-card" data-as-component="cta" data-as-component-id="' + componentId + '">',
          '  <h2 class="as-cta-title">' + escapeHtml(title) + '</h2>',
          desc ? '  <p class="as-cta-description">' + escapeHtml(desc) + '</p>' : '',
          '  <a class="as-btn ' + variant + '" href="' + escapeHtml(url) + '" data-as-track="cta_click"' + targetAttr + '>',
          '    ' + escapeHtml(btnText),
          '  </a>',
          '</div>'
        ].filter(Boolean).join('\n');

        closeModal();
        insertSnippet(ctaHtml);
      });
    }

    // Attach Snippet Buttons
    toolbar.querySelector('.as-snippet-cta').addEventListener('click', function (e) {
      e.preventDefault();
      openCtaModal();
    });

    toolbar.querySelector('.as-snippet-info').addEventListener('click', function (e) {
      e.preventDefault();
      var infoHtml = [
        '<div class="as-info-card" data-as-component="info-card">',
        '  <p>Insira aqui informações técnicas, dados de payback ou normas regulatórias (ex: Lei 14.300/2022).</p>',
        '</div>'
      ].join('\n');
      insertSnippet(infoHtml);
    });

    toolbar.querySelector('.as-snippet-callout').addEventListener('click', function (e) {
      e.preventDefault();
      var calloutHtml = [
        '<div class="as-callout" data-as-component="callout">',
        '  <strong>Atenção Solar:</strong> Verifique sempre o selo INMETRO e a garantia de potência linear antes de contratar.',
        '</div>'
      ].join('\n');
      insertSnippet(calloutHtml);
    });

    toolbar.querySelector('.as-snippet-banner').addEventListener('click', function (e) {
      e.preventDefault();
      var bannerHtml = [
        '<div class="as-banner" data-as-component="banner">',
        '  <h3>Economize na sua conta de energia solar</h3>',
        '  <p>Simule gratuitamente a potência necessária para seu imóvel e receba orçamentos de empresas verificadas.</p>',
        '  <a class="as-btn as-btn--secondary" href="/calculadora">Simular Economia Agora</a>',
        '</div>'
      ].join('\n');
      insertSnippet(bannerHtml);
    });

    toolbar.querySelector('.as-snippet-table').addEventListener('click', function (e) {
      e.preventDefault();
      var tableHtml = [
        '<div class="as-table-wrap" data-as-component="table">',
        '  <table>',
        '    <thead>',
        '      <tr>',
        '        <th>Tecnologia de Módulo</th>',
        '        <th>Eficiência Média</th>',
        '        <th>Garantia de Desempenho</th>',
        '      </tr>',
        '    </thead>',
        '    <tbody>',
        '      <tr>',
        '        <td>Monocristalino TopCon (N-Type)</td>',
        '        <td>21.5% - 22.8%</td>',
        '        <td>30 anos</td>',
        '      </tr>',
        '      <tr>',
        '        <td>Heterojunção HJT</td>',
        '        <td>22.0% - 23.5%</td>',
        '        <td>30 anos</td>',
        '      </tr>',
        '    </tbody>',
        '  </table>',
        '</div>'
      ].join('\n');
      insertSnippet(tableHtml);
    });

    // 3. Preview Action
    toolbar.querySelector('.as-btn-preview').addEventListener('click', function (e) {
      e.preventDefault();
      var currentContent = (currentMode === 'code') ? codeEditor.value : getQuillHtml();
      
      // Store draft content in sessionStorage for instant local preview or open preview window
      try {
        window.sessionStorage.setItem('as_article_draft_preview', currentContent);
      } catch (err) {
        // quota exceeded or private mode, fallback
      }

      var previewUrl = '/blog/preview';
      // Open in a responsive preview popup
      window.open(previewUrl, 'ArticleStudioPreview', 'width=1100,height=800,scrollbars=yes,resizable=yes');
    });

    // 4. Form Submit Sync Guarantee
    if (form) {
      form.addEventListener('submit', function () {
        var finalContent = (currentMode === 'code') ? codeEditor.value : getQuillHtml();
        rawTextarea.value = finalContent;
      });
    }
  }

  // Idempotent listeners
  document.addEventListener('DOMContentLoaded', initArticleStudio);
  document.addEventListener('turbo:load', initArticleStudio);
})();
