# Avalia Solar — Brand Page CTA Visibility V1

**Status:** código implementado em branch; release exige CI, testes E2E e migração aplicada.  
**PDR de origem:** `PDR_AvaliaSolar_CTA_BrandPage_ReadOnly_2026-11-05.md` (documento entregue na conversa).  
**Rota do painel:** `/dashboard?company_id={id}&tab=settings` → **Chamadas para Ação**.

## Decisão de produto
- Um único botão **WhatsApp** no hero, nunca no card lateral.
- **Solicitar orçamento** e **WhatsApp** podem ser ligados/desligados independentemente.
- O card lateral exibe apenas website, telefone comercial público, e-mail público e localização.
- **Comparar** e **Avaliar** continuam disponíveis independentemente dos dois controles.
- O gerenciamento não oferece compra, distribuição nem venda de leads: contatos são orgânicos.

## Contrato
**Persistência:** `companies.quote_cta_enabled` (boolean, default TRUE), reutilizando `companies.whatsapp_enabled`; `companies.cta_visibility_version` para concorrência.

`GET /api/v1/company_dashboard/cta_visibility?company_id={id}`

```json
{
  "company_id": 372,
  "preferences": { "quote_cta_enabled": true, "whatsapp_enabled": true },
  "availability": { "quote": true, "whatsapp": true, "whatsapp_configured": true },
  "effective": { "quote": true, "whatsapp": true },
  "version": 0
}
```

`PATCH /api/v1/company_dashboard/cta_visibility?company_id={id}`

```json
{ "quote_cta_enabled": false, "whatsapp_enabled": true, "expected_version": 0 }
```

- Campos booleanos são estritos (strings `"true"`, `"false"` e `1` são inválidos).
- `expected_version` numérico inteiro obrigatório, rejeitar versão antiga com **409**; carregar novamente antes de salvar.
- `company_id` explícito deve coincidir com a empresa autorizada, para impedir fallback silencioso de multiempresa.
- Ativação que exige entitlement indisponível → **403**; WhatsApp sem contato válido → **422**.
- Desativação é imediata e nunca exige aprovação de moderador.
- Preferências não concedem feature: o backend calcula **effective** pelo plano ativo, feature gate e contato válido.
- Não sincronizar preferências pela rota `update_ctas` que permanece em `PendingChange`.

## Superfícies
| Superfície | WhatsApp | Orçamento | Como é resolvido |
|---|---|---|---|
| CompanyCTAGroup (hero) | Único CTA pago permitido | Gate + quote_cta_enabled | `getCompanyWhatsAppHref`, `canUsePaidConversion` |
| CompanyContactCard (overview/Contato) | Nenhum | Nenhum | Somente dados públicos, sem card vazio |
| StickyCTA | Nenhum novo WhatsApp | Gate + quote_cta_enabled | Sticky substitui ação ao rolar |
| Top1StickyCTA | Nenhum WhatsApp | Gate + quote_cta_enabled | Não aparece junto com StickyCTA no legado |
| Cards de empresa/Busca/Categorias | Contato orgânico com gate | Gate + quote_cta_enabled | Serializer expõe preferência a todas as superfícies |

## UX e estados
- Checkboxes nativos acessíveis, área clicável >44px, rótulos completos e controles independentes.
- Preview instantâneo, claramente identificado como não publicado até salvar.
- Plano Free/expirado: visualização bloqueada, sem permitir ativar via patch.
- Se empresa tinha preferência ON e perdeu plano, permitir desligar o canal; reativar só após elegibilidade.
- Erro ao salvar: rollback do estado visual para o último snapshot confirmado.
- Troca de company_id: esvaziar snapshot e recarregar via GET; não vazar dados de outra empresa.
- Sem WhatsApp cadastrado: manter canal indisponível e pedir configuração válida.

## Telemetria
- Mantido `company_cta_clicked` e `cta_type`/`cta_location` históricos.
- Adicionado `profile_layout_version=cta_single_whatsapp_v1` ao evento.
- Backend publica `company_cta_visibility_changed` em logs estruturados/ActiveSupport::Notifications **depois** de salvar; sem número ou e-mail.
- Dashboard: `company_cta_visibility_saved` e `company_cta_visibility_save_failed` sem informações de contato.
- Não considerar cliques em `wa.me` como conversas confirmadas; nenhuma inferência de conversão sem evento posterior confiável.

## Sequência de deploy
1. **MIGRATION:** aplicar `20261105173000_add_company_cta_visibility_preferences.rb` antes do backend que lê as colunas.
2. **BACKEND:** publicar resolver, serializers, GET/PATCH e auditar owner + Free + versionamento.
3. **CACHE/REVALIDATION:** configurar `NEXT_REVALIDATE_URL` e `NEXT_REVALIDATE_SECRET` em ambos os serviços. O PATCH chama `PublicProfileRevalidator.call!` após commit e retorna `cache_state=revalidated`; falhas enfileiram `PublicProfileRevalidationJob` com `cache_state=pending_retry`. Sem configuração, retorna `not_configured` e o dashboard **não** afirma publicação instantânea. O cache Redis do perfil usa `updated_at` com microssegundos para impedir leitura antiga em mudanças rápidas.
4. **FRONTEND:** publicar ajustes públicos e painel juntos. `NEXT_PUBLIC_CTA_VISIBILITY_UI_V1=false` oculta apenas a nova interface do painel no rollout/rollback, **sem desativar a proteção das preferências persistidas**.
5. **ROLLBACK:** reverter frontend/backend mantendo colunas intactas; **não** apagar preferências sem migração de dados.
6. Avaliar feature flag de UI por segmento antes de rollout generalizado; o backend nunca deverá ignorar preferências existentes em um rollback visual.

## Testes
```bash
cd AB0-1-back
bundle exec rails db:migrate
bundle exec rspec spec/requests/api/v1/company_dashboard_cta_visibility_spec.rb spec/services/company_cta_visibility_resolver_spec.rb

cd ../AB0-1-front
npm test -- --runInBand lib/feature-access.spec.ts app/companies/'[id]'/components/CompanyCTAGroup.spec.tsx __tests__/components/CompanyContactCard.test.tsx app/dashboard/components/cta-visibility/CtaVisibilitySettings.spec.tsx
npm run typecheck
npm run build
```

**QA PWA:** 320, 360, 390, 430, 768 e 1440 px. Confirmar os 4 estados ON/OFF, ausência de CTA duplicado na aba Contato, comparador/avaliações, links válidos, sticky de rank 1, teclado e contraste.

## Pendências operacionais (não devem ser marcadas concluídas antes de evidência)
- [ ] RSpec/Jest/typecheck/build comprovadamente verdes em CI.
- [ ] E2E Playwright real em Chromium, Firefox e WebKit, inclusive salvar → atualizar perfil.
- [ ] Rollout controlado e monitoramento de erros 403/422/500, CTR por canal e plano.
- [ ] Medição após 7 e 14 dias (depende de passagem de tempo, não executável no commit).
- [ ] Deprecar aliases antigos somente após confirmar consumidores e compatibilidade.

## UI-CTA-02 — Hierarquia compacta PWA (2026-11-07, main)

Referência visual aprovada: Brand Page WEG com orçamento azul, WhatsApp verde,
estrela de avaliar junto ao coração e checkbox Comparar sem moldura, alinhado à direita.
Esta seção altera somente o **layout**, sem alterar elegibilidade ou caminhos de conversão.

### Contrato visual e de interação
- Em até 1023px, a linha de identidade exibe **Favoritar** e **Avaliar (estrela âmbar)**;
  compartilhamento continua disponível na experiência desktop. A estrela aponta para
  o formulário real da empresa com nome acessível `Avaliar empresa: {nome}`.
- Abaixo das informações da empresa, os CTAs pagos **Solicitar orçamento** e **WhatsApp**
  ficam na mesma linha, com grid proporcional **1.3:1**, gap **6px** e alvo de **44px**;
  texto semibold de 12px em 320px, 13px a partir de 380px e 14px a partir de 420px.
- Abaixo, **Comparar** mantém checkbox nativo e área de interação de pelo menos 44px,
  sem card ou contorno externo, alinhado à direita. Estado desabilitado e toast mantidos.
- Acima de 1024px, preserva compartilhamento na identidade e **Avaliar** na faixa
  de ações. Não renderizar ícones de avaliação duplicados na mesma faixa visível.
- O componente `Button` aplica `max-sm:min-h-[48px]`, e o CSS global aplica
  `button { min-height: 48px; }` em mobile; os CTAs pagos utilizam uma
  exceção **local** via `!min-h-11`, sem alterar as regras compartilhadas.
- A cor não substitui a identificação por texto/aria-label. Respeitar foco de teclado,
  contraste e `prefers-reduced-motion`.

### Regras preservadas (obrigatórias)
- Orçamento e WhatsApp somente quando `resolveCompanyConversionCTAs` autoriza,
  com preferências independentes por empresa e por plano.
- **Comparar e Avaliar continuam disponíveis em planos Free**.
- Um único WhatsApp no hero e nenhum WhatsApp redundante no `CompanyContactCard`.
- Não alterar URLs, rastreamento (`cta_location: hero`), eventos, consentimento,
  fluxo do lead wizard ou regras de monetização.

### QA / TDD
- Testes: `app/companies/[id]/components/CompanyCTAGroup.spec.tsx`,
  `__tests__/components/CompanyProfileHeader.spec.tsx`,
  `tests/e2e/brand-page-cta-visibility.spec.ts`.
- Viewports: 320, 360, 390, 430, 768, 1440px; garantir sem overflow,
  com estrela visível no mobile e link de avaliação visível no CTA desktop.
- Validar navegação do link de avaliação, clique no WhatsApp, abrir wizard,
  alternar comparação e testar plano Free, pago, vencido e estados sem contato.
- **Validação de execução não presumida:** confirmar CI, WebKit/iOS,
  permissões e versão publicada antes de marcar rollout concluído.
