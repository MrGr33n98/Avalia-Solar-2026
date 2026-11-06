// The Plan console remains a Rails/ActiveAdmin form. JavaScript only enhances
// the preview/template selection; server-side validation and authorization rule.
(function () {
  'use strict';

  function initPlanFeatureEditor() {
    var summary = document.getElementById('plan-feature-summary');
    if (!summary || summary.dataset.bound === 'true') return;
    var form = summary.closest('form');
    if (!form) return;
    summary.dataset.bound = 'true';

    var inputs = Array.prototype.slice.call(
      form.querySelectorAll('[data-plan-feature-input="true"]')
    );
    var templateSelector = form.querySelector('#plan_plan_tier_template');
    var applyButton = form.querySelector('#plan-apply-template');
    var companyCount = Number(summary.dataset.planCompanyCount || 0);

    function currentValue(input) {
      if (input.dataset.planFeatureType === 'integer') {
        return input.value.trim() === '' ? null : Number(input.value);
      }
      return input.checked;
    }

    function originalValue(input) {
      var value = input.dataset.planFeatureOriginal;
      if (input.dataset.planFeatureType === 'integer') {
        return value === '' ? null : Number(value);
      }
      return value === 'true';
    }

    function create(tag, text, cssClass) {
      var element = document.createElement(tag);
      element.textContent = text;
      if (cssClass) element.className = cssClass;
      return element;
    }

    function render() {
      var changes = inputs.filter(function (input) {
        return currentValue(input) !== originalValue(input);
      });
      var enabled = inputs.filter(function (input) {
        return input.dataset.planFeatureType === 'boolean' && input.checked;
      });
      inputs.forEach(function (input) {
        var row = input.closest('.plan-feature-item');
        if (!row) return;
        var state = row.querySelector('[data-plan-feature-state="true"]');
        if (!state) return;
        state.textContent = input.dataset.planFeatureType === 'integer'
          ? (input.value.trim() === '' ? 'NÃO DEFINIDO' : 'CONFIGURADO')
          : (input.checked ? 'ATIVO' : 'BLOQUEADO');
        row.classList.toggle('plan-feature-item--changed',
                             currentValue(input) !== originalValue(input));
      });

      summary.replaceChildren();
      summary.appendChild(create(
        'p',
        enabled.length + ' funcionalidades ativas · ' + changes.length +
          ' alterações pendentes · ' + companyCount + ' empresas vinculadas',
        'plan-feature-summary__headline'
      ));
      if (changes.length) {
        var list = document.createElement('ul');
        list.className = 'plan-feature-summary__changes';
        changes.forEach(function (input) {
          var row = input.closest('.plan-feature-item');
          var title = row && row.querySelector('.plan-feature-title');
          var value = currentValue(input);
          var label = value === true ? 'Ativado' : value === false ? 'Desativado'
            : value === null ? 'Sem valor' : String(value);
          list.appendChild(create(
            'li', (title ? title.textContent : input.dataset.planFeatureKey) +
              ': ' + label
          ));
        });
        summary.appendChild(list);
      } else {
        summary.appendChild(create('p', 'Nenhuma funcionalidade foi alterada.'));
      }
    }

    inputs.forEach(function (input) {
      input.addEventListener('change', render);
      input.addEventListener('input', render);
    });

    if (applyButton && templateSelector) {
      applyButton.addEventListener('click', function () {
        var tier = templateSelector.value;
        if (!window.confirm(
          'Aplicar os padrões do plano ' + tier.toUpperCase() +
          '? As seleções e limites atuais serão substituídos. O salvamento não é automático.'
        )) return;
        inputs.forEach(function (input) {
          var defaults = JSON.parse(input.dataset.planFeatureDefaults || '{}');
          var value = defaults[tier];
          if (input.dataset.planFeatureType === 'integer') {
            input.value = value === null || value === undefined ? '' : String(value);
          } else {
            input.checked = value === true;
          }
        });
        render();
      });
    }

    form.addEventListener('submit', function (event) {
      if (inputs.some(function (input) {
        return input.dataset.planFeatureType === 'integer' &&
          input.value.trim() !== '' &&
          (!/^\d+$/.test(input.value.trim()) || Number(input.value) > 2147483647);
      })) {
        event.preventDefault();
        window.alert('Revise os limites: use somente inteiros não negativos.');
        return;
      }
      if (!window.confirm(
        'Salvar alterações neste plano? ' + companyCount +
        ' empresas estão vinculadas e podem ser afetadas. Esta ação não altera cobranças do Stripe.'
      )) {
        event.preventDefault();
      }
    });

    render();
  }

  document.addEventListener('DOMContentLoaded', initPlanFeatureEditor);
  document.addEventListener('turbo:load', initPlanFeatureEditor);
  if (document.readyState !== 'loading') initPlanFeatureEditor();
})();
