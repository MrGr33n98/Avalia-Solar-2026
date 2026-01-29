# Relatório de Implementação de Analytics

## Resumo Executivo
Foi realizada uma reestruturação completa do sistema de rastreamento de eventos para garantir consistência, conformidade com a LGPD e cobertura total das jornadas críticas do usuário. O sistema agora utiliza um serviço centralizado (`TrackEventService`) que padroniza o envio de dados e protege a privacidade do usuário.

## Jornadas Cobertas
1.  **Onboarding:** Registro, confirmação de e-mail e criação de empresa.
2.  **Engajamento:** Login, logout, busca e visualização de artigos.
3.  **Conversão:** Geração de leads (iniciado, verificado, distribuído) e avaliações.
4.  **Gestão B2B:** Solicitações de alteração no dashboard (logo, banner, CTAs, categorias).

## Melhorias Técnicas Implementadas
- **Padronização:** Todos os eventos agora seguem o padrão snake_case e utilizam o `TrackEventService`.
- **Conformidade LGPD:** Implementada sanitização de metadados com whitelist estrita.
- **Rastreamento UTM:** Centralizado no `BaseController` para capturar origem de tráfego em eventos server-side.
- **Deduplicação:** Proteção contra eventos repetidos no mesmo segundo.
- **Real-time:** Transmissão automática via ActionCable para monitoramento em tempo real.
- **Consistência de Dados:** Uso de transações para garantir que eventos sejam salvos apenas se a ação principal for bem-sucedida.

## Gaps Identificados
| Tipo | Descrição | Impacto |
| :--- | :--- | :--- |
| **Funcional** | Falta rastreamento de cliques em banners via backend. | Visibilidade limitada de CTR no dashboard. |
| **Técnico** | UTMs não são persistidas na sessão do backend. | Perda de atribuição se o usuário navegar sem UTMs antes de converter. |
| **Performance** | Chamadas para Mixpanel são síncronas. | Pode aumentar o tempo de resposta em picos de tráfego. |

## Plano de Ação (Próximos Passos)
1.  **Fase 1 (Curto Prazo):**
    - [ ] Mover chamadas de provedores externos (Mixpanel) para jobs em segundo plano (Sidekiq/ActiveJob).
    - [ ] Implementar persistência de UTM na sessão (`session[:utm_params]`) para atribuição de longa duração.
2.  **Fase 2 (Médio Prazo):**
    - [ ] Criar endpoint de redirecionamento para banners (`/banners/:id/click`) para rastrear cliques no backend.
    - [ ] Implementar rastreamento de erros de validação e falhas de login para análise de UX.
3.  **Fase 3 (Longo Prazo):**
    - [ ] Implementar "Identity Merge" no Mixpanel para vincular usuários anônimos a perfis identificados após o login.
    - [ ] Dashboard de auditoria interna para visualização de eventos agregados.
