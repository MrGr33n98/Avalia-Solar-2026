# PDR — Brand Page: CTA único de WhatsApp + preferências de conversão

**Projeto:** Avalia Solar · **Data:** 2026-11-05 · **Status:** Implementação em branch para QA.

## Decisão de produto
- Um único WhatsApp na Brand Page, **sempre no hero**. `CompanyContactCard` é exclusivamente informativo.
- O gestor configura separadamente **Solicitar orçamento** e **WhatsApp** por checkbox, dentro do Dashboard > Configurações de Conversão.
- O plano/entitlement continua sendo o limite superior; a preferência de exibição nunca desbloqueia um recurso.
- Não vender, distribuir ou cobrar por leads. Contatos orgânicos acontecem por iniciativa do visitante.
- Comparar e Avaliar continuam disponíveis mesmo sem ambos os CTAs pagos.

## Root Cause comprovado
1. `CompanyCTAGroup` e `CompanyContactCard` usavam `getCompanyWhatsAppHref(company)`, gerando dois botões idênticos.
2. Ambos apontavam para o mesmo link público normalizado, mas geravam eventos `company_cta_clicked` com `cta_location: hero` e `sidebar`.
3. Contato lateral tinha condição ternária `whatsappHref ? WhatsApp : phoneValue ? Telefone`, ocultando indevidamente o telefone quando o WhatsApp estava habilitado.
4. `CompanySettings` permitia editar URLs e template, sem preferência independente de orçamento.
5. A página também possui CTA sticky desktop e top-1 mobile, que precisavam respeitar a desativação de orçamento.

## Stories
| Story | Resultado esperado |
|---|---|
| US01 | Visitante encontra WhatsApp apenas uma vez no hero, sem duplicidade lateral. |
| US02 | Visitante encontra telefone, website, e-mail público e localização independentemente do WhatsApp. |
| US03 | Gestor ativa/desativa WhatsApp sem afetar orçamento. |
| US04 | Gestor ativa/desativa orçamento sem afetar WhatsApp. |
| US05 | Empresa Free ou com entitlement revogado não exibe nem habilita CTA pago. |
| US06 | Desativação repercute também nos CTAs sticky e no painel lateral de ajuda. |
| US07 | Visitante pode sempre Comparar e Avaliar. |
| US08 | Gestor muda a configuração diretamente, com feedback de sucesso/erro e rollback. |
| US09 | Alteração é autorizada por empresa, impedindo que outra conta modifique o cadastro. |
| US10 | Eventos de cliques no WhatsApp do hero continuam com `cta_type: whatsapp`, `cta_location: hero`; não há evento de WhatsApp lateral. |

## Contrato e fontes de verdade
- Campo existente `companies.whatsapp_enabled` controla a escolha do gestor para WhatsApp.
- Campo novo `companies.quote_cta_enabled` controla a escolha do gestor para orçamento. Migration `20261105183000`, `DEFAULT true NOT NULL` para preservar o comportamento de empresas legadas.
- `PATCH /api/v1/company_dashboard/cta_visibility?company_id={id}` recebe somente `quote_cta_enabled` e/ou `whatsapp_enabled` como booleanos; autenticação de dashboard e `authorize @company, :edit_company?`.
- Atualização é imediata. A moderação de URLs e textos continua em `POST update_ctas` com `PendingChange`.
- O serializer público inclui `quote_cta_enabled` para a Brand Page e mantém o campo WhatsApp efetivo já existente.

### Matriz decisória
| Plano/entitlement | Quote pref. | WhatsApp pref. + URL válida | Hero |
|---|---:|---:|---|
| Pago e permitido | ON | ON | Orçamento + WhatsApp |
| Pago e permitido | ON | OFF | Orçamento |
| Pago e permitido | OFF | ON | WhatsApp |
| Pago e permitido | OFF | OFF | Comparar + Avaliar |
| Free / bloqueado | Qualquer | Qualquer | Comparar + Avaliar (nenhum CTA pago liberado) |

## Tasklist e entregas
- [x] Mapear as origens dos dois botões e os eventos distintos.
- [x] Remover WhatsApp lateral; preservar telefone mesmo quando WhatsApp do hero está ativo.
- [x] Adicionar campo quote persistente e default retrocompatível.
- [x] Adicionar `quote_cta_enabled` ao contrato público.
- [x] Criar endpoint autenticado, isolado por empresa, com parâmetros estritos.
- [x] Adicionar controles visuais independentes no dashboard.
- [x] Preservar gate de WhatsApp pago e validado.
- [x] Respeitar preferência de orçamento no hero, no sticky desktop, no Top1 mobile e na ajuda do sidebar.
- [x] Corrigir caminho de abertura do wizard no sticky desktop com `onRequest`.
- [x] Preservar eventos de cliques existentes no hero, telefone, e-mail, site e orçamento.
- [x] Adicionar testes frontend e de request.
- [ ] Executar Jest, RSpec, typecheck, build e E2E na CI/VM.
- [ ] Validar manualmente viewports 320/360/390/430/768/1440, com teclado e leitor de tela.
- [ ] Testar planos Free, Essencial e Pro; estado de assinatura vencida/entitlement revogado.
- [ ] Implantar a migration antes do deploy da versão que lê/escreve a nova preferência.
- [ ] Validar telemetria pós-deploy e comparar CTR com baseline (sem prometer uplift).
- [ ] Aprovar rollout e merge depois de checks verdes.

## Definition of Done
1. No máximo um link para WhatsApp com destaque em cada Brand Page: hero no desktop/PWA.
2. Nenhum WhatsApp duplicado em sidebar/aba Contato.
3. Telefone público independente; e-mail privado nunca é exposto.
4. Escolha dos 2 CTAs totalmente independente e refletida em todas as superfícies.
5. Nenhum recurso pago desbloqueado por checkbox.
6. API protege contra escrita inter-tenant e dados não booleanos.
7. Eventos existentes, incluindo `cta_location`, mantêm semântica.
8. Loading, falha, retry/rollback e estados sem dados são acessíveis.
9. QA automatizado e visual aprovado; sem erros de layout no PWA.
10. Deploy com migration e monitoramento de erros antes de considerar concluído.

## Riscos e pontos de atenção
- Páginas cacheadas podem demorar a refletir preferência; a estratégia de revalidação do perfil público deve ser conferida em E2E.
- `quote_cta_enabled` é novo e requer a migration no banco.
- O campo `whatsapp_enabled` já pode estar habilitado, mas sem número válido não renderiza CTA.
- Não atribuir mudanças de CTR à UI sem experimento e tamanho amostral.
- Os dois sticky CTA podem concorrer em layouts específicos; conferir visibilidade mobile e safe areas.
