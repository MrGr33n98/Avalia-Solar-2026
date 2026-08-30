#!/usr/bin/env node
const fs = require('fs');
const { execFileSync } = require('child_process');
const root = process.cwd();
const outDir = `${root}/docs/security-audit`;
const htmlPath = `${outDir}/relatorio-auditoria-seguranca.html`;
const pdfPath = `${outDir}/relatorio-auditoria-seguranca.pdf`;
const date = new Date().toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
const findings = [
  { sev:'crítica', cat:'Chaves expostas', loc:'AB0-1-back/config/credentials.yml:9', desc:'secret_key_base está versionado em texto claro. O valor protege MessageVerifiers e cookies Rails; qualquer leitor do repositório pode forjar tokens/cookies assinados.', code:'secret_key_base: c1142f298c9d280516ab7439d73027df...', impact:'Comprometimento de sessões e dados protegidos.', fix:'Revogar/rotacionar imediatamente; remover do histórico; usar Rails credentials cifradas ou secret manager; bloquear startup sem segredo de produção.' },
  { sev:'alta', cat:'Chaves expostas', loc:'AB0-1-back/config/database.yml:28-30', desc:'Configuração de produção aceita host, usuário e senha padrão quando variáveis estão ausentes, incluindo password.', code:'password: <%= ENV.fetch("POSTGRES_PASSWORD") { "password" } %>', impact:'Deploy mal configurado pode conectar com credencial previsível.', fix:'Usar ENV.fetch sem fallback em produção e falhar no boot; validar POSTGRES_PASSWORD e demais segredos.' },
  { sev:'alta', cat:'IDOR', loc:'AB0-1-back/app/controllers/api/v1/financing_proposals_controller.rb:91-95', desc:'status busca Lead apenas por params[:id], sem autenticação, posse ou conferência com company_id.', code:'lead = ::Lead.find(params[:id])', impact:'Qualquer cliente que conheça um ID pode consultar status de proposta de outro cliente.', fix:'Exigir autenticação apropriada e buscar por company/owner; usar escopo autorizado e identificador não enumerável.' },
  { sev:'média', cat:'XSS', loc:'AB0-1-front/app/companies/[id]/categories/[categorySlug]/page.tsx:114-117; AB0-1-front/app/companies/CompaniesPageClient.tsx:654-659; AB0-1-front/app/melhores-empresas/[category_slug]/[state]/[city]/page.tsx:150-153', desc:'JSON.stringify de dados que podem conter conteúdo persistido é inserido diretamente em script via dangerouslySetInnerHTML. JSON não escapa </script> para contexto HTML.', code:'dangerouslySetInnerHTML={{ __html: JSON.stringify(itemList) }}', impact:'Conteúdo armazenado com fechamento de script pode injetar markup/script na página.', fix:'Serializar para contexto HTML seguro, escapando <, >, &, ou usar utilitário de JSON-LD seguro; validar campos e CSP como defesa secundária.' },
];
const counts = { crítica:1, alta:2, média:1, baixa:0, 'ponto forte':0 };
const colors = { crítica:'#B91C1C', alta:'#EA580C', média:'#D97706', baixa:'#2563EB', 'ponto forte':'#059669' };
const rows = findings.map(f => `<tr><td><span class="chip" style="background:${colors[f.sev]}">${f.sev}</span></td><td><code>${f.loc}</code></td><td><b>${f.cat}</b><br>${f.desc}<pre>${f.code}</pre><b>Impacto:</b> ${f.impact}<br><b>Correção:</b> ${f.fix}</td></tr>`).join('');
const issueBlocks = findings.map((f,i)=>`--- ISSUE ${i+1} ---
# [Segurança] ${f.desc.split('.')[0]}

Labels sugeridas: security, ${f.sev}

## Descrição
${f.desc}

## Evidência
\`${f.loc}\`
\`\`\`
${f.code}
\`\`\`

## Impacto
${f.impact}

## Sugestão de correção
${f.fix}

## Critérios de aceite
- [ ] Segredo/objeto só pode ser acessado por chamador autorizado.
- [ ] Teste automatizado cobre tentativa não autorizada.
- [ ] Nenhum segredo permanece no código ou histórico.
- [ ] Logs e respostas não expõem dados sensíveis.

--- FIM ISSUE ${i+1} ---`)
const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Relatório de Auditoria de Segurança — Avalia Solar 2026</title><style>
@page{size:A4;margin:20mm 18mm 18mm}*{box-sizing:border-box}body{font-family:Arial,sans-serif;color:#172033;font-size:10px;line-height:1.42;margin:0}h1{font-size:30px;line-height:1.1;color:#0f274f;margin:0 0 16px}h2{font-size:18px;color:#0f274f;border-bottom:2px solid #dbe5f2;padding-bottom:5px;margin:22px 0 10px}h3{font-size:12px;color:#0f274f;margin:14px 0 5px}.cover{height:245mm;display:flex;flex-direction:column;justify-content:center;border-top:10px solid #0f274f}.sub{font-size:15px;color:#52627a}.meta{margin-top:35px;padding:14px;background:#f1f6fb;border-left:5px solid #2563EB}.page{break-before:page}.cards{display:flex;gap:10px;margin:12px 0}.card{flex:1;background:#f7f9fc;border-radius:8px;padding:10px;border-top:5px solid #2563EB}.num{font-size:25px;font-weight:bold;color:#0f274f}.charts{display:flex;gap:25px;align-items:center}.donut{width:130px;height:130px;border-radius:50%;background:conic-gradient(#B91C1C 0 25%,#EA580C 25% 75%,#D97706 75% 100%);position:relative}.donut:after{content:'';position:absolute;inset:30px;background:white;border-radius:50%}.legend div{margin:7px 0}.sw{display:inline-block;width:11px;height:11px;border-radius:2px;margin-right:6px}.barrow{display:flex;align-items:center;margin:8px 0}.barlabel{width:105px}.bar{height:14px;background:#EA580C;border-radius:3px}.bar.crit{background:#B91C1C}.bar.med{background:#D97706}.bar.strong{background:#059669}table{width:100%;border-collapse:collapse;margin-top:10px;break-inside:auto}tr{break-inside:avoid}th{background:#0f274f;color:white;text-align:left;padding:7px}td{border:1px solid #d8e0ea;padding:7px;vertical-align:top}td:first-child{width:65px}.chip{color:#fff;font-size:9px;font-weight:bold;padding:3px 6px;border-radius:10px;white-space:nowrap}code{font-family:monospace;font-size:8.5px;color:#324968}pre{white-space:pre-wrap;background:#f4f6f9;padding:6px;border-left:3px solid #b8c7da;font-size:8.5px;margin:6px 0}.ok{color:#059669;font-weight:bold}.risk{background:#fff7ed;border-left:4px solid #D97706;padding:9px;margin:8px 0}.issue{white-space:pre-wrap;background:#f5f7fa;border:1px solid #ccd6e3;padding:10px;font-family:monospace;font-size:8px;break-inside:avoid;margin:10px 0}.footer{position:fixed;bottom:-11mm;left:0;right:0;text-align:center;color:#718096;font-size:8px}
</style></head><body><div class="footer">Avalia Solar 2026 · Auditoria de Segurança · página <span class="pageNumber"></span></div>
<section class="cover"><div class="sub">AVALIA SOLAR 2026</div><h1>Relatório de Auditoria de Segurança</h1><div class="sub">Cinco categorias: isolamento, autorização, IDOR, segredos e XSS</div><div class="meta"><b>Data:</b> ${date}<br><b>Escopo:</b> monorepo completo: Rails API, Next.js, Expo, Docker, CI e configurações.<br><b>Metodologia:</b> categorias mapeadas para Rails + ActiveRecord + JWT/Devise/Pundit, Next.js/React, Expo e artefatos de infraestrutura. Foram reportados somente sinks e fluxos verificados no código versionado; hipóteses sem rota ou evidência foram excluídas.</div></section>
<section class="page"><h2>Resumo executivo</h2><div class="cards"><div class="card" style="border-color:#B91C1C"><div class="num">1</div>Crítica</div><div class="card" style="border-color:#EA580C"><div class="num">2</div>Altas</div><div class="card" style="border-color:#D97706"><div class="num">1</div>Média</div><div class="card" style="border-color:#059669"><div class="num">0</div>Baixas</div></div><div class="charts"><div class="donut"></div><div class="legend"><div><span class="sw" style="background:#B91C1C"></span>Crítica — 1</div><div><span class="sw" style="background:#EA580C"></span>Alta — 2</div><div><span class="sw" style="background:#D97706"></span>Média — 1</div><div><span class="sw" style="background:#2563EB"></span>Baixa — 0</div></div></div><h3>Achados por categoria</h3><div class="barrow"><div class="barlabel">Chaves expostas</div><div class="bar crit" style="width:125px"></div><b>&nbsp;2</b></div><div class="barrow"><div class="barlabel">IDOR</div><div class="bar" style="width:62px"></div><b>&nbsp;1</b></div><div class="barrow"><div class="barlabel">XSS</div><div class="bar med" style="width:62px"></div><b>&nbsp;1</b></div><h2>Pontos fortes</h2><p class="ok">✓ Mecanismo de isolamento identificado: filtros manuais por empresa/associação, memberships ativas e Pundit; vários controllers usam escopos aninhados.</p><p class="ok">✓ Usuários: show/update/destroy têm autenticação e bloqueio para o próprio usuário ou admin (<code>users_controller.rb:3-5, 119-131</code>).</p><p class="ok">✓ Lead distributions: autenticação e autorização por company/membership (<code>lead_distributions_controller.rb:2-4, 42-49</code>).</p><p class="ok">✓ Intent scores: autenticação, empresa derivada do score e Pundit/feature gate antes da resposta (<code>intent_scores_controller.rb:6-9, 80-90</code>).</p><h2>Pontos fracos centrais</h2><div class="risk">Segredo criptográfico versionado, defaults de banco permissivos, status de proposta sem posse e JSON-LD raw em contexto HTML.</div></section>
<section class="page"><h2>Achados detalhados</h2><table><thead><tr><th>Severidade</th><th>Arquivo:linha</th><th>Descrição e evidência</th></tr></thead><tbody>${rows}</tbody></table><h2>Recomendações priorizadas</h2><ol><li><b>P1:</b> rotacionar secret_key_base e revisar histórico Git; bloquear boot de produção sem segredos.</li><li><b>P1:</b> proteger status de propostas por autenticação e escopo de proprietário/empresa.</li><li><b>P2:</b> substituir defaults de database.yml por validação obrigatória no ambiente de produção.</li><li><b>P2:</b> trocar inserções JSON-LD por serialização HTML-safe.</li><li><b>P3:</b> adicionar testes de autorização/IDOR para todos os recursos sensíveis e rodar Gitleaks no histórico.</li></ol><h2>Cobertura e itens corretos</h2><p>Foram enumerados os controllers REST em <code>AB0-1-back/app/controllers/api/v1</code>, policies, rotas, queries por ID, frontend Next.js, mobile Expo, Docker, CI e configurações. Controllers de dashboard/company-admin geralmente combinam <code>authenticate_api_user</code>, empresa ativa e Pundit. O controller de fórum analisado não está registrado em <code>routes.rb</code>, portanto não foi reportado como endpoint explorável.</p></section>
<section class="page"><h2>ISSUES PARA O GITHUB</h2><p>Textos completos, prontos para copiar e colar.</p>${issueBlocks.map(x=>`<div class="issue">${x.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</div>`).join('')}</section></body></html>`;
fs.writeFileSync(htmlPath, html);
execFileSync('/usr/bin/google-chrome', ['--headless','--no-sandbox','--disable-gpu',`--print-to-pdf=${pdfPath}`,htmlPath], {stdio:'ignore'});
console.log(pdfPath);
