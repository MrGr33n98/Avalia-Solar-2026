(function() {
  const SCRIPT_URL = document.currentScript ? document.currentScript.src : "";
  const BASE_URL = SCRIPT_URL ? new URL(SCRIPT_URL).origin : "http://localhost:3001";

  function initWidgets() {
    const containers = document.querySelectorAll("[data-avalia-solar-widget]");
    containers.forEach(container => {
      if (container.dataset.initialized) return;
      const companyId = container.dataset.companyId;
      const apiKey = container.dataset.apiKey;
      const theme = container.dataset.theme || "light";
      if (!companyId) return;
      const iframe = document.createElement("iframe");
      iframe.style.border = "none"; iframe.style.width = "200px"; iframe.style.height = "220px";
      iframe.style.backgroundColor = "transparent"; iframe.setAttribute("scrolling", "no");
      container.appendChild(iframe);
      container.dataset.initialized = "true";
      const apiUrl = BASE_URL + "/api/v1/companies/" + companyId + "/widget_data?api_key=" + apiKey;
      fetch(apiUrl).then(r => r.json()).then(data => inject(iframe, data, theme)).catch(e => console.error(e));
    });
  }

  function inject(iframe, data, theme) {
    const isDark = theme === "dark";
    const badgeImg = data.verified_badge_image_url;
    const stars = Array(5).fill(0).map((_, i) => {
      const fill = i < Math.floor(data.rating_avg) ? "#facc15" : (isDark ? "#334155" : "#cbd5e1");
      return `<svg width="14" height="14" viewBox="0 0 24 24" fill="${fill}"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`;
    }).join("");

    const html = `
      <html><head><style>
        body { margin: 0; padding: 10px; font-family: sans-serif; display: flex; justify-content: center; }
        .widget { display: flex; flex-direction: column; padding: 16px; border-radius: 12px; border: 1px solid ${isDark ? "#1e293b" : "#e2e8f0"}; background: ${isDark ? "#0f172a" : "#fff"}; color: ${isDark ? "#f1f5f9" : "#0f172a"}; text-align: center; width: 160px; text-decoration: none; }
        .badge-img { max-height: 48px; max-width: 48px; margin-bottom: 8px; }
        .label { font-size: 10px; font-weight: bold; color: #2563eb; }
        .name { font-size: 13px; font-weight: bold; margin: 4px 0; }
        .rating { display: flex; align-items: center; justify-content: center; gap: 4px; }
      </style></head><body>
        <a href="${data.public_profile_url}" target="_blank" class="widget">
          <div class="badge-container">${badgeImg ? `<img src="${badgeImg}" class="badge-img">` : "?"}</div>
          <div class="label">Empresa Verificada</div>
          <div class="name">${data.name}</div>
          <div class="rating"><div>${stars}</div><b>${data.rating_avg.toFixed(1)}</b></div>
          <div style="font-size: 10px; margin-top:8px">${data.reviews_count} avaliações</div>
        </a>
      </body></html>`;
    const doc = iframe.contentWindow.document; doc.open(); doc.write(html); doc.close();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initWidgets); else initWidgets();
})();
