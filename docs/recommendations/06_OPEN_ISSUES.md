# Questões Abertas, Riscos Remanescentes e Próximos Passos (Open Issues)

**Projeto:** Avalia Solar 2026  
**Data:** 20/10/2026  
**Status do Projeto:** PRs 0 a 5 Concluídos no Branch de Trabalho  

---

## 1. Itens e Riscos Remanescentes

1. **Backfill de `show_alternatives` em Perfis Legados:**
   - Com a correção que impede perfis gratuitos de alegarem "Perfil Protegido Exclusivo", empresas do plano Free que estavam com `show_alternatives: false` em seu `feature_access` (por configuração legada inconsistente) agora simplesmente têm a seção de concorrentes ocultada (`mode = 'hidden'`), sem falso marketing.
   - *Ação Recomendada:* Executar script de migração/normalização de dados no ambiente apropriado para redefinir `show_alternatives: true` para todas as empresas do tier Free, permitindo que a descoberta e comparação voltem a funcionar normalmente para todos os perfis gratuitos.

2. **Auditoria de Desempenho e Core Web Vitals (LCP / CLS) sob Tráfego Real:**
   - A introdução do esqueleto visual (`loading skeleton`) com aspect-ratio e dimensões idênticas às dos cards evita mudanças de layout (*Cumulative Layout Shift* - CLS) durante o carregamento assíncrono.
   - *Ação Recomendada:* Monitorar no PostHog e Sentry Performance a métrica de LCP da Company Page após o deploy em homologação/produção.

3. **Verificação de Cobertura Multi-Cidades (`CompanyServiceArea`):**
   - O ranking agora prioriza empresas com áreas de atendimento cadastradas que correspondem à UF e cidade do comprador. No entanto, empresas que preencheram apenas dados no texto livre da descrição (sem cadastrar registros formais em `company_service_areas`) cairão no fallback estadual ou nacional.
   - *Ação Recomendada:* Notificar o time de CS/Ops para incentivar as empresas a preencherem suas áreas de cobertura na central da empresa (`/app`).

4. **Execução de RSpec na Pipeline de CI:**
   - As novas especificações de teste adicionadas em `spec/services/banners/banner_delivery_query_spec.rb` cobrem integralmente o novo comportamento de governança de anúncios. Elas serão validadas automaticamente pelo GitHub Actions no workflow `ci-web-backend.yml` no momento da abertura do Pull Request.
