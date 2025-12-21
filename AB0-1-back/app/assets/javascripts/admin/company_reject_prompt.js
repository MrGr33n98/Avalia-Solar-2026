/* global Rails */

(function () {
  function buildForm(action, reason) {
    const form = document.createElement('form');
    form.method = 'post';
    form.action = action;

    const methodInput = document.createElement('input');
    methodInput.type = 'hidden';
    methodInput.name = '_method';
    methodInput.value = 'put';
    form.appendChild(methodInput);

    const token = document.querySelector('meta[name="csrf-token"]');
    if (token) {
      const tokenInput = document.createElement('input');
      tokenInput.type = 'hidden';
      tokenInput.name = 'authenticity_token';
      tokenInput.value = token.getAttribute('content');
      form.appendChild(tokenInput);
    }

    const reasonInput = document.createElement('input');
    reasonInput.type = 'hidden';
    reasonInput.name = 'reason';
    reasonInput.value = reason || '';
    form.appendChild(reasonInput);

    document.body.appendChild(form);
    form.submit();
  }

  function handleClick(event) {
    const link = event.target.closest('a[data-behavior="reject-company"]');
    if (!link) return;

    event.preventDefault();

    const promptText = link.getAttribute('data-prompt') || 'Motivo da reprovação:';
    const reason = window.prompt(promptText);
    if (reason === null) return;

    const url = link.getAttribute('data-url') || link.getAttribute('href');
    if (!url) return;

    buildForm(url, reason.trim());
  }

  document.addEventListener('click', handleClick);
})();
