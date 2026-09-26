# Privacy review

- Não persistir IP bruto de pixel/click em novos eventos; revisar e migrar/expirar payloads antigos conforme política aprovada.
- UA: normalizar para categorias de classificação; não expor raw UA na timeline. Definir retenção, acesso restrito e limpeza.
- Sanitizar e truncar preview; corpo integral protegido por autorização, sem socket.
- Payload realtime e labels de métricas/logs não incluem email, nome, URL completa, IP, UA ou corpo.
- Tokens de tracking não contêm IDs previsíveis; URLs HTTPS e tokens opacos. Nunca registrar token em logs.
- Admin técnico exige permissão explícita e auditoria.
- Revisão jurídica/privacidade do uso de pixel, consentimento e retenção é gate externo; não inferir conformidade apenas pelo código.
