/* global document */

(function () {
  function normalize(value) {
    return String(value || '').trim().toLowerCase();
  }

  function selectedNamesFrom(root) {
    return Array.from(root.querySelectorAll('[data-role="checkbox"]:checked')).map((checkbox) =>
      checkbox.getAttribute('data-company-name') || ''
    );
  }

  function updateSelectedSummary(root) {
    const selectedList = root.querySelector('[data-role="selected-list"]');
    if (!selectedList) return;

    const selectedNames = selectedNamesFrom(root).filter(Boolean);
    selectedList.innerHTML = '';

    if (selectedNames.length === 0) {
      const empty = document.createElement('span');
      empty.className = 'category-company-selector__empty-selected';
      empty.setAttribute('data-role', 'selected-empty');
      empty.textContent = 'Nenhuma empresa selecionada.';
      selectedList.appendChild(empty);
      return;
    }

    selectedNames.forEach((name) => {
      const chip = document.createElement('span');
      chip.className = 'category-company-selector__chip';
      chip.textContent = name;
      selectedList.appendChild(chip);
    });
  }

  function updateCount(root) {
    const countNode = root.querySelector('[data-role="count"]');
    if (!countNode) return;
    const checked = root.querySelectorAll('[data-role="checkbox"]:checked').length;
    countNode.textContent = `${checked} selecionadas`;
  }

  function updateVisibleItems(root) {
    const searchInput = root.querySelector('[data-role="search"]');
    const selectedToggle = root.querySelector('[data-role="selected-toggle"]');
    const emptyResults = root.querySelector('[data-role="empty-results"]');
    const items = Array.from(root.querySelectorAll('[data-role="item"]'));

    const term = normalize(searchInput && searchInput.value);
    const showSelectedOnly = Boolean(selectedToggle && selectedToggle.checked);

    let visibleCount = 0;

    items.forEach((item) => {
      const searchableText = normalize(item.getAttribute('data-searchable-text'));
      const checkbox = item.querySelector('[data-role="checkbox"]');
      const matchesTerm = !term || searchableText.includes(term);
      const matchesSelectedFilter = !showSelectedOnly || Boolean(checkbox && checkbox.checked);
      const visible = matchesTerm && matchesSelectedFilter;

      item.style.display = visible ? '' : 'none';
      item.classList.toggle('is-selected', Boolean(checkbox && checkbox.checked));

      if (visible) visibleCount += 1;
    });

    if (emptyResults) {
      emptyResults.style.display = visibleCount === 0 ? 'block' : 'none';
    }
  }

  function refresh(root) {
    updateCount(root);
    updateSelectedSummary(root);
    updateVisibleItems(root);
  }

  function bind(root) {
    if (!root || root.dataset.bound === '1') return;
    root.dataset.bound = '1';

    const searchInput = root.querySelector('[data-role="search"]');
    const selectedToggle = root.querySelector('[data-role="selected-toggle"]');
    const checkboxes = root.querySelectorAll('[data-role="checkbox"]');

    if (searchInput) {
      searchInput.addEventListener('input', function () {
        updateVisibleItems(root);
      });
    }

    if (selectedToggle) {
      selectedToggle.addEventListener('change', function () {
        updateVisibleItems(root);
      });
    }

    checkboxes.forEach((checkbox) => {
      checkbox.addEventListener('change', function () {
        refresh(root);
      });
    });

    refresh(root);
  }

  function init() {
    document
      .querySelectorAll('[data-behavior="category-company-selector"]')
      .forEach((root) => bind(root));
  }

  document.addEventListener('DOMContentLoaded', init);
  document.addEventListener('turbo:load', init);
})();
