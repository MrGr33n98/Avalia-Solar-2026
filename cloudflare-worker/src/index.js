/**
 * AvaliaSolar-Titan-Gateway-v7 (Omni-Resilient)
 * Senior Cloud Architect - Tier 1 Infrastructure
 */

const BRAZILIAN_STATES = {
  'AC': 'Acre', 'AL': 'Alagoas', 'AP': 'Amapá', 'AM': 'Amazonas', 'BA': 'Bahia', 'CE': 'Ceará',
  'DF': 'Distrito Federal', 'ES': 'Espírito Santo', 'GO': 'Goiás', 'MA': 'Maranhão', 'MT': 'Mato Grosso',
  'MS': 'Mato Grosso do Sul', 'MG': 'Minas Gerais', 'PA': 'Pará', 'PB': 'Paraíba', 'PR': 'Paraná',
  'PE': 'Pernambuco', 'PI': 'Piauí', 'RJ': 'Rio de Janeiro', 'RN': 'Rio Grande do Norte',
  'RS': 'Rio Grande do Sul', 'RO': 'Rondônia', 'RR': 'Roraima', 'SC': 'Santa Catarina',
  'SP': 'São Paulo', 'SE': 'Sergipe', 'TO': 'Tocantins'
};

const MAINTENANCE_HTML = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Avalia Solar - Instabilidade Temporária</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background: #f4f7f9; color: #1a202c; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; text-align: center; }
        .container { background: white; padding: 2rem; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); max-width: 450px; }
        h1 { color: #f59e0b; font-size: 1.5rem; margin-bottom: 1rem; }
        p { line-height: 1.6; color: #4a5568; }
        .footer { margin-top: 1.5rem; font-size: 0.875rem; color: #a0aec0; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Estamos trabalhando no sistema</h1>
        <p>O Avalia Solar está passando por uma instabilidade momentânea. Nossa equipe técnica já foi notificada e está resolvendo.</p>
        <p>Por favor, tente recarregar a página em alguns instantes.</p>
        <div class="footer">ID da Requisição: {REQUEST_ID}</div>
    </div>
</body>
</html>
`;

export default {
  async fetch(request, env, ctx) {
    const startTime = performance.now();
    const requestId = crypto.randomUUID();
    const url = new URL(request.url);
    const cf = request.cf || {};

    // 1. HEALTH CHECK & EARLY HINTS
    if (url.pathname === "/cdn-health") {
      return new Response(JSON.stringify({ status: "UP", colo: cf.colo, requestId, version: "v7.0.0" }), { headers: { "Content-Type": "application/json" } });
    }

    if (request.headers.get("Accept")?.includes("text/html")) {
      ctx.waitUntil(new Response(null, {
        status: 103,
        headers: { "Link": "</assets/application.css>; rel=preload; as=style, </assets/application.js>; rel=preload; as=script" }
      }));
    }

    // 2. BOT MITIGATION & CORS
    const botScore = cf.botScore || 100;
    if (botScore < 20 && !url.pathname.includes('/public/')) {
      return new Response(JSON.stringify({ error: "Access Denied", id: requestId }), { status: 403, headers: { "Content-Type": "application/json", "X-Request-ID": requestId } });
    }

    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization, X-User-City, X-User-State-Code, X-Request-ID",
          "Access-Control-Max-Age": "86400",
        },
      });
    }

    // 3. GEO-NORMALIZATION & SANITIZATION
    const safeNormalize = (str) => {
      try { return str ? decodeURIComponent(escape(str)) : 'unknown'; } catch (e) { return str || 'unknown'; }
    };

    const newHeaders = new Headers(request.headers);
    ['X-User-City', 'X-User-State-Code', 'X-Edge-Signature', 'X-Request-ID', 'X-Bot-Score'].forEach(h => newHeaders.delete(h));

    const city = safeNormalize(cf.city);
    const state = cf.regionCode || 'unknown';

    newHeaders.set('X-User-City', city);
    newHeaders.set('X-User-State-Code', state);
    newHeaders.set('X-Request-ID', requestId);
    newHeaders.set('X-Bot-Score', botScore.toString());
    newHeaders.set('X-Edge-Signature', env.SHARED_SECRET || 'avaliasolar_enterprise_secret_2024');

    // 4. RESILIENCE: FETCH WITH RETRY
    const BACKEND_URL = env.BACKEND_URL || 'https://api.avaliasolar.com.br';
    const targetUrl = `${BACKEND_URL}${url.pathname}${url.search}`;

    const fetchWithRetry = async (target, options, attempts = 3) => {
      for (let i = 0; i < attempts; i++) {
        try {
          const res = await fetch(target, options);
          if (res.status < 500) return res;
          if (i === attempts - 1) return res;
        } catch (e) {
          if (i === attempts - 1) throw e;
        }
        await new Promise(r => setTimeout(r, 100 * Math.pow(2, i))); // Exponential Backoff
      }
    };

    try {
      const response = await fetchWithRetry(targetUrl, {
        method: request.method,
        headers: newHeaders,
        body: request.method !== 'GET' && request.method !== 'HEAD' ? request.body : null,
        cf: { cacheTtl: 3600, cacheEverything: url.pathname.includes('/assets/'), staleWhileRevalidate: 86400 }
      });

      // 5. OBSERVABILITY & SECURITY HARDENING
      const edgeDuration = (performance.now() - startTime).toFixed(2);
      const secureResponse = new Response(response.body, response);

      secureResponse.headers.set('X-Request-ID', requestId);
      secureResponse.headers.set('X-Edge-Time', `${edgeDuration}ms`);
      secureResponse.headers.set('Server-Timing', `edge;dur=${edgeDuration};desc="Titan v7"`);
      secureResponse.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
      secureResponse.headers.set('X-Content-Type-Options', 'nosniff');

      ctx.waitUntil((async () => {
        console.log(`[ACCESS] ID: ${requestId} | Path: ${url.pathname} | Status: ${response.status} | Time: ${edgeDuration}ms`);
      })());

      return secureResponse;

    } catch (error) {
      // 6. DISASTER RECOVERY: HTML FALLBACK
      console.error(`[CRITICAL] ID: ${requestId} | Error: ${error.message}`);
      
      if (request.headers.get("Accept")?.includes("text/html")) {
        return new Response(MAINTENANCE_HTML.replace('{REQUEST_ID}', requestId), {
          status: 503,
          headers: { "Content-Type": "text/html" }
        });
      }

      return new Response(JSON.stringify({ error: "Resilience Failure", id: requestId }), {
        status: 504,
        headers: { "Content-Type": "application/json" }
      });
    }
  }
};
