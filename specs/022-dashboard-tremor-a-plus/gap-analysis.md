# Gap / root-cause candidates
Confirmado no código ≠ incidente confirmado em produção.
- Resolução de tenant: page.tsx usa `void selectCompany(match)` e `setViewMode('company_admin')`; `effectiveCompanyId` prefere `activeCompany`. Hipótese race/flash quando contexto anterior não mudou. Admin com target não localizado pode permanecer em empresa anterior. Reproduzir com deferred promise, backend policy e URL; corrigir só se confirmado. Guard frontend não substitui autorização Rails.
- Navegação: config e TabsContent contêm aliases e rotas externas. Spec 017 descreve canon info; código atual normaliza para product-general. Unificar resolver e preservar ambos; testar destinos antes de remover nada.
- Shells: EnterpriseDashboard é canônico empresarial, DashboardLayout system admin, CompanyDashboardModern ainda existe na árvore. Não concluir duplicação em runtime sem import graph; rastrear call sites.
- Layout: fixed rail e dynamic padding, skeleton fixo, viewport-dependent rem e `overflow-x-clip` podem esconder overflow. Medir computed CSS e scrollWidth; não mascarar problema com clip.
- CSS: tokens existentes convivem com classes hardcoded e clay em caminhos observados. Scope dashboard; não alterar `globals` do marketplace. Validar dark presets.
- Overview: 5 useQuery calls e hook dashboard; duplicação de fetch é hipótese, medir waterfall e query keys. Verificar período real de analytics/campaign/leads/export. Não confundir zero com ausência. Spec 017 diz remover mocks e saudação, mas `Olá` ainda aparece no código consultado; decidir cópia operacional sem extrapolar.
- Acessibilidade: tabelas alternativas já observadas em gráficos, não presumir cobertura de todas. Auditar focus, aria, keyboard e contraste.
- Tremor: diferença Tailwind 3.3.3 vs 3.4/4, React 18 vs 19, Recharts atual; risco evitado por inspiração visual somente; prototipar com stack existente, sem port de código ou instalação Tremor.
- CRM/Reviewer: árvore mapeada, componentes por página e runtime não revisados integralmente. W0 obrigatório; não declarar redesign completo sem matriz de paridade.
