# ADRs propostas
| ID | Decisão | Consequência / alternativa rejeitada |
|---|---|---|
| D01 | Port seletivo mcpcn, React18/Vite/CSS atual | Não migrar React19/Tailwind4/Next16 |
| D02 | Host-first semântica + marca própria | Sem fontes remotas ou troca global de tema |
| D03 | Reusar bridge e contratos atuais | Sem servidor Node em produção e sem novo endpoint público no MVP |
| D04 | Registry privado primeiro, somente fonte UI | Não publicar dados/fixtures reais/secretos; distribuir apenas componentes permitidos |
| D05 | Build singlefile 120 KiB gzip rígido | Otimizar em vez de relaxar gate |
| D06 | `data/actions/appearance/control` e IDs estáveis | Evitar acoplar bloco ao MCP host ou índices |
| D07 | Versionar registry e manter compatibilidade do envelope v1 | Nova tool/mutação exige spec e autorização própria |
| D08 | REA em dev/CI isolado, complementar | Playwright/axe e testes de contrato são gates primários |
| D09 | Não introduzir mapas/checkout/eventos no MVP | Depende de CSP, dados, política e autorização |
| D10 | Reutilização entre superfícies por tokens/contratos primeiro | Não compartilhar código browser/host indiscriminadamente |
