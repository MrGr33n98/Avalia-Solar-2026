/* global $ */

(function () {
  const STORAGE_SELECTION_KEY = 'avalia_admin_location_selection';
  const STORAGE_CITIES_KEY_PREFIX = 'avalia_admin_cities_cache_';
  const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24h

  const DEFAULT_MAX_RETRIES = 2;
  const DEFAULT_RETRY_DELAY_MS = 250;

  const STATES = [
    { name: 'Acre', code: 'AC' },
    { name: 'Alagoas', code: 'AL' },
    { name: 'Amapá', code: 'AP' },
    { name: 'Amazonas', code: 'AM' },
    { name: 'Bahia', code: 'BA' },
    { name: 'Ceará', code: 'CE' },
    { name: 'Distrito Federal', code: 'DF' },
    { name: 'Espírito Santo', code: 'ES' },
    { name: 'Goiás', code: 'GO' },
    { name: 'Maranhão', code: 'MA' },
    { name: 'Mato Grosso', code: 'MT' },
    { name: 'Mato Grosso do Sul', code: 'MS' },
    { name: 'Minas Gerais', code: 'MG' },
    { name: 'Pará', code: 'PA' },
    { name: 'Paraíba', code: 'PB' },
    { name: 'Paraná', code: 'PR' },
    { name: 'Pernambuco', code: 'PE' },
    { name: 'Piauí', code: 'PI' },
    { name: 'Rio de Janeiro', code: 'RJ' },
    { name: 'Rio Grande do Norte', code: 'RN' },
    { name: 'Rio Grande do Sul', code: 'RS' },
    { name: 'Rondônia', code: 'RO' },
    { name: 'Roraima', code: 'RR' },
    { name: 'Santa Catarina', code: 'SC' },
    { name: 'São Paulo', code: 'SP' },
    { name: 'Sergipe', code: 'SE' },
    { name: 'Tocantins', code: 'TO' },
  ];

  const byName = new Map(STATES.map((s) => [normalizeKey(s.name), s.code]));
  const byCode = new Map(STATES.map((s) => [s.code, s.name]));

  const cityCache = new Map(); // stateCode -> { cities, timestamp }
  const inFlight = new Map(); // stateCode -> Promise<string[]>

  let activeAbortController = null;

  function normalizeKey(value) {
    return String(value || '').trim().toLowerCase();
  }

  function supportsLocalStorage() {
    try {
      return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
    } catch {
      return false;
    }
  }

  function getSelectionFromStorage() {
    if (!supportsLocalStorage()) return null;
    try {
      const raw = window.localStorage.getItem(STORAGE_SELECTION_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') return null;
      return {
        state: typeof parsed.state === 'string' ? parsed.state : '',
        city: typeof parsed.city === 'string' ? parsed.city : '',
      };
    } catch {
      return null;
    }
  }

  function setSelectionToStorage(stateCode, cityName) {
    if (!supportsLocalStorage()) return;
    try {
      window.localStorage.setItem(
        STORAGE_SELECTION_KEY,
        JSON.stringify({ state: stateCode || '', city: cityName || '' })
      );
    } catch {
      // ignore
    }
  }

  function getCachedCitiesFromStorage(stateCode) {
    if (!supportsLocalStorage()) return null;
    try {
      const raw = window.localStorage.getItem(`${STORAGE_CITIES_KEY_PREFIX}${stateCode}`);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      const timestamp = Number(parsed?.timestamp);
      const cities = Array.isArray(parsed?.cities) ? parsed.cities : null;
      if (!Number.isFinite(timestamp) || !cities) return null;
      if (Date.now() - timestamp > CACHE_TTL_MS) {
        window.localStorage.removeItem(`${STORAGE_CITIES_KEY_PREFIX}${stateCode}`);
        return null;
      }
      return cities
        .filter((c) => c !== null && c !== undefined)
        .map((c) => String(c).trim())
        .filter(Boolean);
    } catch {
      return null;
    }
  }

  function setCachedCitiesToStorage(stateCode, cities) {
    if (!supportsLocalStorage()) return;
    try {
      window.localStorage.setItem(
        `${STORAGE_CITIES_KEY_PREFIX}${stateCode}`,
        JSON.stringify({ timestamp: Date.now(), cities: cities || [] })
      );
    } catch {
      // ignore
    }
  }

  function mapStateToCode(stateValue) {
    const raw = String(stateValue || '').trim();
    if (!raw) return '';
    if (byCode.has(raw)) return raw;
    const code = byName.get(normalizeKey(raw));
    return code || raw;
  }

  function ensureInlineHint(selectEl, idSuffix, className) {
    const container = selectEl.closest('li');
    if (!container) return null;

    const id = `${selectEl.id}_${idSuffix}`;
    let node = document.getElementById(id);
    if (node && !container.contains(node)) node = null;
    if (!node) {
      node = document.createElement('p');
      node.id = id;
      node.className = className;
      container.appendChild(node);
    }

    const describedBy = (selectEl.getAttribute('aria-describedby') || '').trim();
    const parts = describedBy ? describedBy.split(/\s+/) : [];
    if (!parts.includes(id)) {
      selectEl.setAttribute('aria-describedby', parts.concat(id).join(' ').trim());
    }

    return node;
  }

  function clearInlineMessage(el) {
    if (!el) return;
    el.textContent = '';
    el.style.display = 'none';
  }

  function setInlineMessage(el, text) {
    if (!el) return;
    el.textContent = text;
    el.style.display = '';
  }

  function ensureLoader(labelEl) {
    if (!labelEl) return null;
    let loader = labelEl.querySelector('.location-loader');
    if (!loader) {
      loader = document.createElement('span');
      loader.className = 'location-loader';
      loader.setAttribute('aria-hidden', 'true');
      labelEl.appendChild(loader);
    }
    return loader;
  }

  function setLoading(citySelectEl, loaderEl, loading) {
    if (loading) {
      if (loaderEl) loaderEl.style.display = '';
      citySelectEl.setAttribute('aria-busy', 'true');
      citySelectEl.classList.add('location-select--loading');
    } else {
      if (loaderEl) loaderEl.style.display = 'none';
      citySelectEl.removeAttribute('aria-busy');
      citySelectEl.classList.remove('location-select--loading');
    }
  }

  function setSelectOptions(selectEl, { placeholder, options, disabled }) {
    while (selectEl.firstChild) selectEl.removeChild(selectEl.firstChild);

    const blankLabel = placeholder || 'Selecione';
    selectEl.appendChild(new Option(blankLabel, ''));

    (options || []).forEach((value) => {
      selectEl.appendChild(new Option(value, value));
    });

    selectEl.disabled = Boolean(disabled);
  }

  function sleep(ms, signal) {
    if (!ms) return Promise.resolve();
    return new Promise((resolve, reject) => {
      const timer = setTimeout(resolve, ms);
      if (!signal) return;
      if (signal.aborted) {
        clearTimeout(timer);
        reject(Object.assign(new Error('Aborted'), { name: 'AbortError' }));
        return;
      }
      const onAbort = () => {
        clearTimeout(timer);
        reject(Object.assign(new Error('Aborted'), { name: 'AbortError' }));
      };
      signal.addEventListener('abort', onAbort, { once: true });
    });
  }

  async function fetchJsonWithRetry(url, { signal, maxRetries, retryDelayMs } = {}) {
    const retries = Number.isFinite(maxRetries) ? maxRetries : DEFAULT_MAX_RETRIES;
    const baseDelay = Number.isFinite(retryDelayMs) ? retryDelayMs : DEFAULT_RETRY_DELAY_MS;

    for (let attempt = 0; attempt <= retries; attempt += 1) {
      try {
        const response = await fetch(url, { signal, headers: { Accept: 'application/json' } });
        if (!response.ok) {
          const err = new Error(`HTTP ${response.status}`);
          err.status = response.status;
          throw err;
        }
        return await response.json();
      } catch (error) {
        if (error?.name === 'AbortError' || signal?.aborted) throw error;
        const status = Number(error?.status);
        const retryableStatus = !Number.isFinite(status) || status >= 500 || status === 429;
        const hasMore = attempt < retries;
        if (!retryableStatus || !hasMore) throw error;
        await sleep(baseDelay * Math.pow(2, attempt), signal);
      }
    }
    return null;
  }

  async function fetchCitiesFromIbge(stateCode, { signal } = {}) {
    const url = `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${encodeURIComponent(
      stateCode
    )}/municipios?orderBy=nome`;
    const data = await fetchJsonWithRetry(url, { signal });
    const cities = Array.isArray(data) ? data : [];
    return cities
      .map((c) => c?.nome)
      .filter((c) => c !== null && c !== undefined)
      .map((c) => String(c).trim())
      .filter(Boolean);
  }

  async function fetchCitiesFromBackend(stateCode, { signal } = {}) {
    const url = `/api/v1/companies/cities?state=${encodeURIComponent(stateCode)}`;
    const data = await fetchJsonWithRetry(url, { signal });
    const cities = Array.isArray(data?.cities) ? data.cities : [];
    return cities
      .filter((c) => c !== null && c !== undefined)
      .map((c) => String(c).trim())
      .filter(Boolean);
  }

  async function getCities(stateCode, { signal, forceRefresh } = {}) {
    const key = String(stateCode || '').trim();
    if (!key) return [];

    const now = Date.now();
    const cached = cityCache.get(key);
    if (!forceRefresh && cached && now - cached.timestamp < CACHE_TTL_MS) return cached.cities;

    const fromStorage = !forceRefresh ? getCachedCitiesFromStorage(key) : null;
    if (fromStorage && fromStorage.length) {
      cityCache.set(key, { cities: fromStorage, timestamp: now });
      return fromStorage;
    }

    if (!forceRefresh && inFlight.has(key)) return inFlight.get(key);

    const request = (async () => {
      let cities = [];
      try {
        cities = await fetchCitiesFromIbge(key, { signal });
      } catch {
        // Fallback to backend endpoint (useful if external access is blocked)
        cities = await fetchCitiesFromBackend(key, { signal });
      }

      const unique = Array.from(new Set(cities));
      cityCache.set(key, { cities: unique, timestamp: Date.now() });
      setCachedCitiesToStorage(key, unique);
      return unique;
    })().finally(() => {
      inFlight.delete(key);
    });

    inFlight.set(key, request);
    return request;
  }

  function validateSelect(selectEl, errorEl, message) {
    const valid = Boolean(String(selectEl.value || '').trim());
    if (valid) {
      selectEl.removeAttribute('aria-invalid');
      clearInlineMessage(errorEl);
      return true;
    }
    selectEl.setAttribute('aria-invalid', 'true');
    setInlineMessage(errorEl, message);
    return false;
  }

  function syncSelect2(selectEl) {
    if (typeof $ !== 'undefined' && $(selectEl).data('select2')) {
      $(selectEl).trigger('change');
    }
  }

  function initForCompanyForm() {
    const stateSelect = document.getElementById('company_state');
    const citySelect = document.getElementById('company_city');
    if (!stateSelect || !citySelect) return;

    if (stateSelect.dataset.locationSelectorBound === '1') return;
    stateSelect.dataset.locationSelectorBound = '1';

    const form = stateSelect.form;
    const stateError = ensureInlineHint(stateSelect, 'error', 'inline-errors location-error');
    const cityError = ensureInlineHint(citySelect, 'error', 'inline-errors location-error');
    clearInlineMessage(stateError);
    clearInlineMessage(cityError);

    const cityContainer = citySelect.closest('li');
    const cityLabel = cityContainer ? cityContainer.querySelector('label') : null;
    const cityLoader = ensureLoader(cityLabel);
    if (cityLoader) cityLoader.style.display = 'none';

    const stateSelectedAttr = stateSelect.getAttribute('data-selected');
    const citySelectedAttr = citySelect.getAttribute('data-selected');

    const preselectedStateRaw = stateSelectedAttr || '';
    const preselectedCityRaw = citySelectedAttr || '';

    const stateCode =
      mapStateToCode(preselectedStateRaw) ||
      mapStateToCode(stateSelect.value);

    const cityName = String(preselectedCityRaw || '').trim();

    if (stateCode && stateSelect.value !== stateCode) {
      stateSelect.value = stateCode;
    }

    async function loadAndApplyCities({ preselectCity, forceRefresh } = {}) {
      const selectedState = String(stateSelect.value || '').trim();

      if (activeAbortController) activeAbortController.abort();
      activeAbortController = new AbortController();

      clearInlineMessage(cityError);

      if (!selectedState) {
        setSelectOptions(citySelect, {
          placeholder: 'Selecione um estado primeiro',
          options: [],
          disabled: true,
        });
        setLoading(citySelect, cityLoader, false);
        syncSelect2(citySelect);
        return;
      }

      setLoading(citySelect, cityLoader, true);
      setSelectOptions(citySelect, { placeholder: 'Carregando...', options: [], disabled: true });
      syncSelect2(citySelect);

      try {
        const cities = await getCities(selectedState, {
          signal: activeAbortController.signal,
          forceRefresh: Boolean(forceRefresh),
        });

        if (!cities || cities.length === 0) {
          setSelectOptions(citySelect, {
            placeholder: 'Nenhuma cidade disponível',
            options: [],
            disabled: true,
          });
          setInlineMessage(cityError, 'Nenhuma cidade disponível para o estado selecionado.');
          syncSelect2(citySelect);
          return;
        }

        setSelectOptions(citySelect, {
          placeholder: 'Selecione uma cidade',
          options: cities,
          disabled: false,
        });
        citySelect.required = true;

        const desired = String(preselectCity || '').trim();
        if (desired) {
          citySelect.value = desired;
        }
        syncSelect2(citySelect);
      } catch (error) {
        if (error?.name === 'AbortError') return;

        setSelectOptions(citySelect, {
          placeholder: 'Erro ao carregar cidades',
          options: [],
          disabled: true,
        });
        setInlineMessage(cityError, 'Falha ao carregar cidades. Verifique sua conexão e tente novamente.');
        syncSelect2(citySelect);
      } finally {
        setLoading(citySelect, cityLoader, false);
      }
    }

    stateSelect.addEventListener('change', () => {
      const state = String(stateSelect.value || '').trim();
      setSelectionToStorage(state, '');
      citySelect.value = '';
      loadAndApplyCities({ preselectCity: '' });
    });

    citySelect.addEventListener('change', () => {
      const state = String(stateSelect.value || '').trim();
      const city = String(citySelect.value || '').trim();
      setSelectionToStorage(state, city);
    });

    if (form) {
      form.addEventListener('submit', (event) => {
        clearInlineMessage(stateError);
        clearInlineMessage(cityError);

        const stateOk = validateSelect(stateSelect, stateError, 'Selecione um estado.');
        const cityMustValidate = Boolean(String(stateSelect.value || '').trim());
        const cityOk = cityMustValidate
          ? validateSelect(citySelect, cityError, 'Selecione uma cidade.')
          : true;

        if (!stateOk) {
          event.preventDefault();
          stateSelect.focus();
          return;
        }

        if (!cityOk) {
          event.preventDefault();
          citySelect.focus();
        }
      });
    }

    if (stateCode) {
      loadAndApplyCities({ preselectCity: cityName });
    } else {
      setSelectOptions(citySelect, { placeholder: 'Selecione um estado primeiro', options: [], disabled: true });
      syncSelect2(citySelect);
    }
  }

  function setupCollapsibleFieldsets() {
    const form = document.querySelector('form.company');
    if (!form) return;

    const fieldsets = form.querySelectorAll('fieldset.inputs');
    fieldsets.forEach((fieldset) => {
      if (fieldset.dataset.collapsibleBound === '1') return;
      fieldset.dataset.collapsibleBound = '1';

      const legend = fieldset.querySelector('legend');
      if (!legend) return;

      fieldset.classList.add('collapsible-fieldset');

      const legendSpan = legend.querySelector('span');
      if (!legendSpan) return;

      legend.addEventListener('click', (e) => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'LABEL') return;
        fieldset.classList.toggle('collapsed');
      });
    });
  }

  function init() {
    initForCompanyForm();
    setupCollapsibleFieldsets();
  }

  window.AvaliaAdminLocationSelector = {
    init,
    _internal: {
      mapStateToCode,
      getCities,
    },
  };
})();
