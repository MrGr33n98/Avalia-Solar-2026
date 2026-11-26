# Princípios não negociáveis
1. Tenant first: autorização no servidor antes de leitura ou mutação; cliente não é fronteira de segurança.
2. Paridade: nenhuma funcionalidade, tab, ação, rota, entitlement, evento ou dado perde significado por mudança visual.
3. Uma fonte de verdade: navegação, tokens, tipos, componentes e regras comerciais não duplicados.
4. TDD: teste falhando reproduzível, patch mínimo, teste verde, refactor e evidência; fixtures isoladas.
5. Performance: baseline por rota; não carregar charts, CRM e editores até necessários; medir, não presumir.
6. Acessibilidade WCAG 2.2 AA, teclado, foco, estados, contraste; respeitar reduced motion.
7. Design: sobriedade inspirada exclusivamente no Tremor UI (Database e blocos operacionais); primário Avalia Solar, sem glows, gradients gratuitos ou métricas fictícias.
8. Privacidade: não armazenar HAR bruto, tokens, cookies, PII ou storageState no git; exportar apenas evidência sanitizada.
9. Rollout incremental reversível; flag por domínio, legacy fallback testado.
10. Autoria: referência visual documentada por bloco; zero código/asset/template Tremor copiado e zero dependência Tremor introduzida.
